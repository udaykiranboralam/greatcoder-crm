import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [sourceDistribution, statusDistribution, demosCompleted] =
      await Promise.all([
        prisma.lead.groupBy({
          by: ["source"],
          _count: true,
        }),
        prisma.lead.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.demo.count({ where: { status: "COMPLETED" } }),
      ]);

    const leadsPerDay: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const count = await prisma.lead.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      });
      leadsPerDay.push({
        date: start.toISOString().split("T")[0],
        count,
      });
    }

    const totalLeads = await prisma.lead.count();
    const demoScheduled = await prisma.lead.count({
      where: { status: "DEMO_SCHEDULED" },
    });
    const converted = await prisma.lead.count({
      where: { status: "CONVERTED" },
    });

    return NextResponse.json({
      success: true,
      data: {
        sourceDistribution: sourceDistribution.map((s) => ({
          source: s.source,
          count: s._count,
        })),
        statusDistribution: statusDistribution.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        leadsPerDay,
        conversionFunnel: {
          totalLeads,
          demoScheduled,
          demosCompleted,
          converted,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}