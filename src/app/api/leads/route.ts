import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore } from "@/lib/lead-scoring";

export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const leads = await prisma.lead.findMany({
      include: {
        conversations: true,
        demos: true,
        followUps: true,
        interestedCourse: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit && !Number.isNaN(limit) ? limit : undefined,
    });
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch leads",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      whatsapp,
      qualification,
      experience,
      currentRole,
      currentLocation,
      interestedCourseId,
      careerGoal,
      budget,
      source,
      learningMode,
      isFresher,
      joiningTimeline,
      preferredCallbackTime,
      assignedToId,
      notes,
    } = body;

    let interestedCourseName: string | null = null;
    if (interestedCourseId) {
      const course = await prisma.course.findUnique({
        where: { id: interestedCourseId },
        select: { name: true },
      });
      interestedCourseName = course?.name || null;
    }

    const scoreResult = calculateLeadScore({
      name,
      phone,
      email,
      qualification,
      experience,
      currentRole,
      currentLocation,
      interestedCourse: interestedCourseName,
      careerGoal,
      demoInterest: false,
      preferredCallbackTime,
      learningMode,
      isFresher,
      joiningTimeline,
      questionsAsked: [],
      messageCount: 0,
      conversationSentiment: null,
    });

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        whatsapp,
        qualification,
        experience,
        currentRole,
        currentLocation,
        interestedCourseId,
        careerGoal,
        budget,
        source: source || "OTHER",
        learningMode,
        isFresher,
        joiningTimeline,
        preferredCallbackTime,
        assignedToId,
        notes,
        leadScore: scoreResult.score,
        temperature: scoreResult.temperature,
        intentReadiness: scoreResult.intentLevel,
        sentiment: scoreResult.sentiment,
        firstContactAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        type: "LEAD_CREATED",
        action: `Lead created with score ${scoreResult.score}`,
        metadata: {
          source: lead.source,
          temperature: scoreResult.temperature,
        },
      },
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create lead",
      },
      { status: 500 }
    );
  }
}