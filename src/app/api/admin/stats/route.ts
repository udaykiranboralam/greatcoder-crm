import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      newLeadsToday,
      hotLeads,
      warmLeads,
      coldLeads,
      demoScheduled,
      demosToday,
      conversions,
      pendingFollowUps,
      avgResult,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.lead.count({ where: { temperature: "HOT" } }),
      prisma.lead.count({ where: { temperature: "WARM" } }),
      prisma.lead.count({ where: { temperature: "COLD" } }),
      prisma.lead.count({ where: { status: "DEMO_SCHEDULED" } }),
      prisma.demo.count({
        where: { scheduledAt: { gte: startOfDay } },
      }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.followUp.count({ where: { status: "PENDING" } }),
      prisma.lead.aggregate({ _avg: { leadScore: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        newLeadsToday,
        hotLeads,
        warmLeads,
        coldLeads,
        demoScheduled,
        demosToday,
        conversions,
        pendingFollowUps,
        avgLeadScore: Math.round(avgResult._avg.leadScore || 0),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard stats",
      },
      { status: 500 }
    );
  }
}