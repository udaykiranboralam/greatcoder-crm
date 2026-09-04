import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: { interestedCourse: true },
    });

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Qualification",
      "Experience",
      "Current Role",
      "Location",
      "Interested Course",
      "Career Goal",
      "Status",
      "Temperature",
      "Lead Score",
      "Source",
      "Learning Mode",
      "Joining Timeline",
      "Created At",
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = leads.map((lead) =>
      [
        lead.id,
        lead.name,
        lead.email,
        lead.phone,
        lead.qualification,
        lead.experience,
        lead.currentRole,
        lead.currentLocation,
        lead.interestedCourse?.name || "",
        lead.careerGoal,
        lead.status,
        lead.temperature,
        lead.leadScore,
        lead.source,
        lead.learningMode || "",
        lead.joiningTimeline || "",
        lead.createdAt.toISOString(),
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to export leads",
      },
      { status: 500 }
    );
  }
}