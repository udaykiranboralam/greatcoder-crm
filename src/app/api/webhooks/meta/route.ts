import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (
      searchParams.get("hub.mode") === "subscribe" &&
      searchParams.get("hub.verify_token") === process.env.META_VERIFY_TOKEN
    ) {
      return new Response(searchParams.get("hub.challenge") || "", {
        status: 200,
      });
    }
    return new Response("Verification failed", { status: 403 });
  } catch {
    return new Response("Verification failed", { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.field === "leadgen" && value?.leadgen_id) {
      const phone = value?.phone_number || null;
      const name = value?.full_name || null;
      const email = value?.email || null;
      const currentLocation = value?.city || value?.state || null;
      const careerGoal = value?.career_goal || value?.interested_course || null;
      const metadata = {
        leadgenId: value.leadgen_id,
        formId: value.form_id,
        createdTime: value.created_time,
        adId: value.ad_id || null,
        adName: value.ad_name || null,
      };

      let lead;
      if (phone) {
        lead = await prisma.lead.findFirst({ where: { phone } });
      }

      if (lead) {
        lead = await prisma.lead.update({
          where: { id: lead.id },
          data: {
            name: name || lead.name,
            email: email || lead.email,
            currentLocation: currentLocation || lead.currentLocation,
            careerGoal: careerGoal || lead.careerGoal,
            metadata: metadata,
          },
        });
      } else {
        lead = await prisma.lead.create({
          data: {
            name,
            email,
            phone,
            currentLocation,
            careerGoal,
            source: "META_ADS",
            metadata,
            firstContactAt: new Date(),
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          leadId: lead.id,
          type: "META_LEAD",
          action: "New lead captured from Meta Ads",
          metadata,
        },
      });

      return NextResponse.json({ success: true, data: { leadId: lead.id } });
    }

    return NextResponse.json({ success: true, data: { received: true } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}