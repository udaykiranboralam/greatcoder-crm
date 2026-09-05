import { NextRequest, NextResponse } from "next/server";
import {
  getVapiConfig,
  handleEndOfCallReport,
  findOrCreateVoiceLead,
  upsertVoiceCall,
  type EndOfCallReportPayload,
} from "@/lib/vapi";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifySignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const { webhookSecret } = getVapiConfig();
  if (!webhookSecret) return true;

  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expected === signatureHeader;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-vapi-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = (payload as { message?: Record<string, unknown> })?.message;
  if (!message) {
    return NextResponse.json({ success: true });
  }

  const type = message.type as string;
  const call = (message.call || {}) as Record<string, unknown>;
  const vapiCallId = (call.id as string) || "";
  const customerNumber = (call.customer as { number?: string })?.number || "";

  try {
    switch (type) {
      case "status-update": {
        const status = message.status as string;
        await upsertVoiceCall(vapiCallId, {
          status,
          customerNumber,
          ...(status === "in-progress"
            ? { startedAt: new Date() }
            : status === "ended"
              ? { endedAt: new Date() }
              : {}),
        });
        break;
      }

      case "call-start":
      case "call-started": {
        const leadId = await findOrCreateVoiceLead(customerNumber);
        await upsertVoiceCall(vapiCallId, {
          status: "ringing",
          customerNumber,
          leadId,
        });
        break;
      }

      case "end-of-call-report": {
        const report = message as unknown as EndOfCallReportPayload;
        await handleEndOfCallReport(report);
        break;
      }

      case "conversation-update":
      case "transcript":
      case "speech-update":
      case "analysis-ready":
      case "recording-ready":
      case "hang":
      default:
        // Informational events — could log, but no persistence needed.
        break;
    }
  } catch (error) {
    console.error("[vapi-webhook]", type, error);
    // Return 2xx so Vapi doesn't retry forever; we log internally.
    return NextResponse.json({ success: true, error: (error as Error).message });
  }

  return NextResponse.json({ success: true });
}