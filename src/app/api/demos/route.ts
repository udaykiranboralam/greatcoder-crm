import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (from || to) {
      where.scheduledAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const demos = await prisma.demo.findMany({
      where,
      include: { lead: true, course: true, scheduledBy: true },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json({ success: true, data: demos });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch demos",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { leadId, courseId, scheduledAt, mode, notes, scheduledById } =
      await req.json();

    if (!leadId || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: "leadId and scheduledAt are required" },
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

    const demo = await prisma.demo.create({
      data: {
        leadId,
        courseId: courseId || null,
        scheduledAt: new Date(scheduledAt),
        mode: mode || "OFFLINE",
        notes,
        scheduledById: scheduledById || null,
      },
      include: { lead: true, course: true },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "DEMO_SCHEDULED" },
    });

    await prisma.activityLog.create({
      data: {
        leadId,
        type: "DEMO_SCHEDULED",
        action: `Demo scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        metadata: { demoId: demo.id, courseId, mode },
      },
    });

    return NextResponse.json({ success: true, data: demo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create demo",
      },
      { status: 500 }
    );
  }
}