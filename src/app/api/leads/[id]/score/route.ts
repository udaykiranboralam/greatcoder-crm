import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore } from "@/lib/lead-scoring";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { conversations: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    let interestedCourseName: string | null = null;
    if (lead.interestedCourseId) {
      const course = await prisma.course.findUnique({
        where: { id: lead.interestedCourseId },
        select: { name: true },
      });
      interestedCourseName = course?.name || null;
    }

    const totalMessages = lead.conversations.reduce(
      (sum, c) => sum + c.messageCount,
      0
    );

    const scoreResult = calculateLeadScore({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      qualification: lead.qualification,
      experience: lead.experience,
      currentRole: lead.currentRole,
      currentLocation: lead.currentLocation,
      interestedCourse: interestedCourseName,
      careerGoal: lead.careerGoal,
      demoInterest: false,
      preferredCallbackTime: lead.preferredCallbackTime,
      learningMode: lead.learningMode,
      isFresher: lead.isFresher,
      joiningTimeline: lead.joiningTimeline,
      questionsAsked: [],
      messageCount: totalMessages,
      conversationSentiment: lead.sentiment,
    });

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        leadScore: scoreResult.score,
        temperature: scoreResult.temperature,
        intentReadiness: scoreResult.intentLevel,
        sentiment: scoreResult.sentiment,
      },
    });

    await prisma.leadScoreHistory.create({
      data: {
        leadId: params.id,
        score: scoreResult.score,
        temperature: scoreResult.temperature,
        reason: scoreResult.recommendedNextAction,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        lead: updatedLead,
        breakdown: scoreResult.breakdown,
        recommendedNextAction: scoreResult.recommendedNextAction,
        probabilityDemoBooking: scoreResult.probabilityDemoBooking,
        probabilityAdmission: scoreResult.probabilityAdmission,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to compute score",
      },
      { status: 500 }
    );
  }
}