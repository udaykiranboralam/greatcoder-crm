import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const followUps = await prisma.followUp.findMany({
      where,
      include: { lead: true, createdBy: true, completedBy: true },
      orderBy: { scheduledFor: "asc" },
    });

    return NextResponse.json({ success: true, data: followUps });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch follow-ups",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { leadId, scheduledFor, priority, note, createdById } =
      await req.json();

    if (!leadId || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: "leadId and scheduledFor are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        scheduledFor: new Date(scheduledFor),
        priority: priority || "MEDIUM",
        note,
        createdById: createdById || null,
      },
      include: { lead: true },
    });

    await prisma.activityLog.create({
      data: {
        leadId,
        type: "FOLLOW_UP_CREATED",
        action: `Follow-up scheduled for ${new Date(scheduledFor).toLocaleString()}`,
        metadata: { followUpId: followUp.id, priority },
      },
    });

    return NextResponse.json(
      { success: true, data: followUp },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create follow-up",
      },
      { status: 500 }
    );
  }
}