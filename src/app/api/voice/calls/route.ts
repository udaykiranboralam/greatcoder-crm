import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOutboundCall } from "@/lib/vapi";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const calls = await prisma.voiceCall.findMany({
      include: {
        lead: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: calls });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { leadId, phone, context, assistantId, phoneNumberId } = body as {
      leadId?: string;
      phone?: string;
      context?: Record<string, string>;
      assistantId?: string;
      phoneNumberId?: string;
    };

    let customerNumber = phone;
    let leadIdResolved = leadId;

    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead not found" },
          { status: 404 }
        );
      }
      customerNumber = lead.phone || customerNumber;
      leadIdResolved = lead.id;
    }

    if (!customerNumber) {
      return NextResponse.json(
        { success: false, error: "A phone number is required to place a call." },
        { status: 400 }
      );
    }

    const leadContext: Record<string, string> = {
      ...(context || {}),
    };

    if (leadIdResolved) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadIdResolved },
        include: { interestedCourse: true },
      });
      if (lead) {
        if (lead.name) leadContext.customerName = lead.name;
        if (lead.currentLocation) leadContext.location = lead.currentLocation;
        if (lead.careerGoal) leadContext.careerGoal = lead.careerGoal;
        if (lead.interestedCourse?.name)
          leadContext.courseInterest = lead.interestedCourse.name;
      }
    }

    const { vapiCallId } = await createOutboundCall({
      customerNumber,
      assistantId,
      phoneNumberId,
      context: Object.keys(leadContext).length ? leadContext : undefined,
      metadata: { leadId: leadIdResolved, initiatedBy: session.user.email },
    });

    await prisma.voiceCall.upsert({
      where: { vapiCallId },
      update: { direction: "outbound", status: "queued" },
      create: {
        vapiCallId,
        leadId: leadIdResolved || null,
        direction: "outbound",
        status: "queued",
        customerNumber,
        assistantId: assistantId || null,
        phoneNumberId: phoneNumberId || null,
        metadata: { initiatedBy: session.user.email },
      },
    });

    return NextResponse.json({ success: true, data: { vapiCallId } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}