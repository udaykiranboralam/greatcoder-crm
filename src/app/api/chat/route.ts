import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiService, detectLanguage } from "@/lib/ai-service";

export async function POST(req: Request) {
  try {
    const { message, leadId } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const language = detectLanguage(message);

    const courses = await prisma.course.findMany({
      where: { isActive: true },
    });
    const courseContext = courses
      .map(
        (c) =>
          `- ${c.name}: ${c.shortDesc || "No description"}. Duration: ${c.duration || "Contact admissions"}. Fee: ${c.price ? `₹${c.price}` : "Contact admissions"}`
      )
      .join("\n");

    let lead;
    if (leadId) {
      lead = await prisma.lead.findUnique({ where: { id: leadId } });
    }
    if (!lead) {
      lead = await prisma.lead.create({
        data: { source: "CHATBOT" },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id, status: "open" },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { leadId: lead.id, language },
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
        content: message,
      },
    });

    const leadInfo = lead.name
      ? [
          `Name: ${lead.name}`,
          `Phone: ${lead.phone || "N/A"}`,
          `Email: ${lead.email || "N/A"}`,
          `Qualification: ${lead.qualification || "N/A"}`,
          `Experience: ${lead.experience || "N/A"}`,
          `Location: ${lead.currentLocation || "N/A"}`,
          `Career Goal: ${lead.careerGoal || "N/A"}`,
        ].join(", ")
      : undefined;

    let reply: string;
    try {
      reply = await aiService.generateChatReply(
        message,
        history,
        courseContext,
        leadInfo,
        language
      );
    } catch {
      reply =
        "Hi! I'm Priya from GreatCoder Trainings 👋 I'd love to help you find the right course. Could you tell me a bit about yourself — your background and what you're looking to learn?";
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
      data: {
        lastMessageAt: new Date(),
        firstContactAt: lead.firstContactAt || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { reply, leadId: lead.id },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}