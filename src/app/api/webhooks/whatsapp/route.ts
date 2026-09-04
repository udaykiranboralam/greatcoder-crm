import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiService, detectLanguage } from "@/lib/ai-service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (
      searchParams.get("hub.mode") === "subscribe" &&
      searchParams.get("hub.verify_token") ===
        process.env.WHATSAPP_VERIFY_TOKEN
    ) {
      return new Response(searchParams.get("hub.challenge") || "", {
        status: 200,
      });
    }
    return new Response("Verification failed", { status: 403 });
  } catch {
    return new Response("Verification failed", { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const profile =
      body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile;

    if (!message) {
      return new Response("OK", { status: 200 });
    }

    const from = message.from;
    const text = message.text?.body || "";

    if (!from || !text) {
      return new Response("OK", { status: 200 });
    }

    const language = detectLanguage(text);

    let lead = await prisma.lead.findFirst({ where: { whatsapp: from } });
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          whatsapp: from,
          name: profile?.name || null,
          phone: from,
          source: "WHATSAPP",
          firstContactAt: new Date(),
        },
      });
    } else {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          name: lead.name || profile?.name || null,
          lastMessageAt: new Date(),
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id, channel: "whatsapp", status: "open" },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { leadId: lead.id, channel: "whatsapp", language },
      });
    }

    const existingMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });
    const history = existingMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: text,
      },
    });

    const courses = await prisma.course.findMany({ where: { isActive: true } });
    const courseContext = courses
      .map(
        (c) =>
          `- ${c.name}: ${c.shortDesc || "No description"}. Duration: ${c.duration || "Contact admissions"}. Fee: ${c.price ? `₹${c.price}` : "Contact admissions"}`
      )
      .join("\n");

    const leadInfo = lead.name
      ? `Name: ${lead.name}, Phone: ${lead.phone || "N/A"}, Qualification: ${lead.qualification || "N/A"}, Experience: ${lead.experience || "N/A"}, Career Goal: ${lead.careerGoal || "N/A"}`
      : undefined;

    let reply: string;
    try {
      reply = await aiService.generateChatReply(
        text,
        history,
        courseContext,
        leadInfo,
        language
      );
    } catch {
      reply =
        "Hi! I'm Priya from GreatCoder Trainings 👋 I'd love to help you find the right course. Could you tell me a bit about your background and what you'd like to learn?";
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 2 },
        lastMessageAt: new Date(),
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastMessageAt: new Date() },
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}