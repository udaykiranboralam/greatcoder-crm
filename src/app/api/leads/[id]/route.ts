import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore } from "@/lib/lead-scoring";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        conversations: true,
        demos: true,
        followUps: true,
        interestedCourse: true,
        assignedTo: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch lead",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existingLead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

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
      status,
      source,
      learningMode,
      isFresher,
      joiningTimeline,
      preferredCallbackTime,
      assignedToId,
      notes,
    } = body;

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
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
        status,
        source,
        learningMode,
        isFresher,
        joiningTimeline,
        preferredCallbackTime,
        assignedToId,
        notes,
      },
    });

    const scoreFieldsChanged =
      name !== undefined ||
      phone !== undefined ||
      email !== undefined ||
      qualification !== undefined ||
      experience !== undefined ||
      currentRole !== undefined ||
      currentLocation !== undefined ||
      interestedCourseId !== undefined ||
      careerGoal !== undefined ||
      isFresher !== undefined ||
      joiningTimeline !== undefined ||
      preferredCallbackTime !== undefined;

    if (scoreFieldsChanged) {
      let interestedCourseName: string | null = null;
      const courseIdToUse =
        interestedCourseId ?? updatedLead.interestedCourseId;
      if (courseIdToUse) {
        const course = await prisma.course.findUnique({
          where: { id: courseIdToUse },
          select: { name: true },
        });
        interestedCourseName = course?.name || null;
      }

      const scoreResult = calculateLeadScore({
        name: updatedLead.name,
        phone: updatedLead.phone,
        email: updatedLead.email,
        qualification: updatedLead.qualification,
        experience: updatedLead.experience,
        currentRole: updatedLead.currentRole,
        currentLocation: updatedLead.currentLocation,
        interestedCourse: interestedCourseName,
        careerGoal: updatedLead.careerGoal,
        demoInterest: false,
        preferredCallbackTime: updatedLead.preferredCallbackTime,
        learningMode: updatedLead.learningMode,
        isFresher: updatedLead.isFresher,
        joiningTimeline: updatedLead.joiningTimeline,
        questionsAsked: [],
        messageCount: 0,
        conversationSentiment: updatedLead.sentiment,
      });

      await prisma.lead.update({
        where: { id: params.id },
        data: {
          leadScore: scoreResult.score,
          temperature: scoreResult.temperature,
          intentReadiness: scoreResult.intentLevel,
          sentiment: scoreResult.sentiment,
        },
      });
    }

    const finalLead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        conversations: true,
        demos: true,
        followUps: true,
        interestedCourse: true,
      },
    });

    return NextResponse.json({ success: true, data: finalLead });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update lead",
      },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    await prisma.lead.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Lead deleted successfully" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete lead",
      },
      { status: 500 }
    );
  }
}