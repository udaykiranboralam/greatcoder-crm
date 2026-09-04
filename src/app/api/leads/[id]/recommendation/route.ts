import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCourseRecommendation } from "@/lib/recommendation";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { interestedCourse: true },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    const recommendation = await getCourseRecommendation({
      interests: lead.careerGoal || lead.interestedCourse?.name || undefined,
      careerGoal: lead.careerGoal || undefined,
      background: lead.qualification || undefined,
      qualification: lead.qualification || undefined,
      experience: lead.experience || undefined,
      currentRole: lead.currentRole || undefined,
      isFresher: lead.isFresher || undefined,
    });

    let dbCourseId: string | null = null;
    try {
      const dbCourse = await prisma.course.findFirst({
        where: {
          OR: [
            { id: recommendation.courseId },
            { slug: recommendation.courseId },
            {
              name: { contains: recommendation.courseName, mode: "insensitive" },
            },
          ],
          isActive: true,
        },
        select: { id: true },
      });
      dbCourseId = dbCourse?.id || null;
    } catch {
      // DB lookup failed; leave courseId null
    }

    const existing = await prisma.leadRecommendation.findFirst({
      where: { leadId: params.id },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.leadRecommendation.update({
          where: { id: existing.id },
          data: {
            courseId: dbCourseId,
            confidence: recommendation.confidence,
            reasoning: recommendation.reasoning,
            alternatives: recommendation.alternatives as unknown as object,
          },
        })
      : await prisma.leadRecommendation.create({
          data: {
            leadId: params.id,
            courseId: dbCourseId,
            confidence: recommendation.confidence,
            reasoning: recommendation.reasoning,
            alternatives: recommendation.alternatives as unknown as object,
          },
        });

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recommendation",
      },
      { status: 500 }
    );
  }
}