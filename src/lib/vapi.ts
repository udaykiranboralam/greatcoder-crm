import { Prisma } from "@prisma/client";
import { calculateLeadScore } from "./lead-scoring";
import { prisma } from "./prisma";

// ─── Configuration ────────────────────────────────────────────────

const VAPI_BASE_URL = "https://api.vapi.ai";

export function getVapiConfig() {
  return {
    apiKey: process.env.VAPI_API_KEY || "",
    assistantId: process.env.VAPI_ASSISTANT_ID || "",
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || "",
    webhookSecret: process.env.VAPI_WEBHOOK_SECRET || "",
  };
}

export function isVapiConfigured(): boolean {
  const { apiKey, assistantId } = getVapiConfig();
  return Boolean(apiKey && assistantId) && apiKey !== "your-vapi-api-key";
}

// ─── Outbound Call ────────────────────────────────────────────────

export interface OutboundCallInput {
  customerNumber: string;
  assistantId?: string;
  phoneNumberId?: string;
  assistantOverrides?: Record<string, unknown>;
  context?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

export async function createOutboundCall(
  input: OutboundCallInput
): Promise<{ vapiCallId: string }> {
  const config = getVapiConfig();
  if (!config.apiKey || config.apiKey === "your-vapi-api-key") {
    throw new Error("VAPI_API_KEY is not configured.");
  }

  const body: Record<string, unknown> = {
    customer: { number: toE164(input.customerNumber) },
    phoneNumberId: input.phoneNumberId || config.phoneNumberId,
    assistantId: input.assistantId || config.assistantId,
  };

  if (input.assistantOverrides) {
    body.assistantOverrides = input.assistantOverrides;
  }
  if (input.context) {
    body.assistantOverrides = {
      ...(input.assistantOverrides as Record<string, unknown> | undefined),
      variableValues: input.context,
    };
  }
  if (input.metadata) body.metadata = input.metadata;

  const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vapi API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return { vapiCallId: data.id as string };
}

// ─── Lead / Conversation helpers used by webhook ──────────────────

export async function findOrCreateVoiceLead(
  customerNumber: string,
  callContext: {
    name?: string;
    email?: string;
  } = {}
): Promise<string> {
  const digits = customerNumber.replace(/\D/g, "");
  const trimmed = digits.length > 10 ? digits.slice(-10) : digits;

  let lead = await prisma.lead.findFirst({
    where: {
      OR: [{ phone: { endsWith: trimmed } }, { phone: customerNumber }],
    },
  });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        name: callContext.name || null,
        email: callContext.email || null,
        phone: customerNumber,
        source: "VOICE",
        status: "NEW",
        temperature: "COLD",
        leadScore: 20,
        firstContactAt: new Date(),
        lastMessageAt: new Date(),
        metadata: { channel: "voice" },
      },
    });
  } else {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastMessageAt: new Date() },
    });
  }

  return lead.id;
}

export async function upsertVoiceCall(
  vapiCallId: string,
  data: Record<string, unknown>
): Promise<void> {
  const existing = await prisma.voiceCall.findUnique({
    where: { vapiCallId },
  });

  if (existing) {
    await prisma.voiceCall.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.voiceCall.create({
      data: { vapiCallId, ...data },
    });
  }
}

export async function handleEndOfCallReport(
  payload: EndOfCallReportPayload,
  leadIdOverride?: string
): Promise<void> {
  const { call, artifact, summary, cost, durationSeconds, endedReason } = payload;

  const vapiCallId = call?.id;
  const customerNumber = call?.customer?.number || "";
  const leadId = leadIdOverride || (await findOrCreateVoiceLead(customerNumber));

  await prisma.voiceCall.upsert({
    where: { vapiCallId: vapiCallId || "unknown" },
    update: {
      leadId,
      status: "ended",
      endedReason: endedReason || "unknown",
      transcript: artifact?.transcript || null,
      recordingUrl: artifact?.recording?.url || null,
      summary: summary || null,
      durationSeconds: durationSeconds || null,
      costUsd: cost || null,
      endedAt: new Date(),
      metadata: (payload.metadata as Prisma.InputJsonValue) || undefined,
    },
    create: {
      vapiCallId: vapiCallId || "unknown",
      leadId,
      direction: "inbound",
      status: "ended",
      endedReason: endedReason || "unknown",
      transcript: artifact?.transcript || null,
      recordingUrl: artifact?.recording?.url || null,
      summary: summary || null,
      durationSeconds: durationSeconds || null,
      costUsd: cost || null,
      customerNumber,
      assistantId: (call?.assistantId as string) || null,
      phoneNumberId: (call?.phoneNumberId as string) || null,
      startedAt: call?.startedAt ? new Date(call.startedAt) : null,
      endedAt: new Date(),
      metadata: (payload.metadata as Prisma.InputJsonValue) || undefined,
    },
  });

  const messages = artifact?.messages || [];
  const messageCount = messages.length;

  if (!leadId) return;

  const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (existingLead) {
    const scored = calculateLeadScore({
      name: existingLead.name,
      phone: existingLead.phone,
      email: existingLead.email,
      qualification: existingLead.qualification,
      experience: existingLead.experience,
      currentRole: existingLead.currentRole,
      currentLocation: existingLead.currentLocation,
      interestedCourse: existingLead.interestedCourseId,
      careerGoal: existingLead.careerGoal,
      demoInterest: !!(summary || "").toLowerCase().includes("demo"),
      preferredCallbackTime: existingLead.preferredCallbackTime,
      isFresher: existingLead.isFresher,
      joiningTimeline: existingLead.joiningTimeline,
      messageCount,
    });

    const voiceMessages = messages
      .filter((m) => typeof m.message === "string" && m.message.trim())
      .map((m) => m.message);

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadScore: scored.score,
        temperature: scored.temperature,
        intentReadiness: scored.intentLevel,
        sentiment: scored.sentiment,
        lastMessageAt: new Date(),
        metadata: {
          ...(existingLead.metadata as Record<string, unknown> | undefined),
          voiceSummary: summary || null,
        },
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        leadId,
        channel: "voice",
        status: "completed",
        messageCount: voiceMessages.length,
        sentiment: scored.sentiment,
        language: "english",
        startedAt: call?.startedAt ? new Date(call.startedAt) : new Date(),
        lastMessageAt: new Date(),
      },
    });

    for (const m of messages) {
      if (typeof m.message === "string" && m.message.trim()) {
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            role: m.role,
            content: m.message,
          },
        });
      }
    }

    await prisma.voiceCall.update({
      where: { vapiCallId: vapiCallId || "unknown" },
      data: { conversationId: conversation.id },
    });

    await prisma.activityLog.create({
      data: {
        leadId,
        type: "voice_call",
        action: "voice_call_completed",
        metadata: { summary, durationSeconds, endedReason },
      },
    });
  }
}

// ─── Types for Vapi payloads ──────────────────────────────────────

export interface VapiCallObject {
  id?: string;
  assistantId?: string;
  phoneNumberId?: string;
  via?: string;
  startedAt?: string;
  endedAt?: string;
  customer?: {
    number?: string;
  };
  endedReason?: string;
  status?: string;
}

export interface EndOfCallReportPayload {
  type?: string;
  endedReason?: string;
  call: VapiCallObject;
  artifact?: {
    transcript?: string;
    recording?: { url?: string };
    messages?: Array<{ role: "user" | "assistant"; message: string }>;
  };
  summary?: string;
  cost?: number;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}