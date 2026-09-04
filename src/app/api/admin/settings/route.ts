import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value || "";
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: map,
        env: {
          aiKeyConfigured: Boolean(process.env.AI_API_KEY),
          whatsappUrl: process.env.WHATSAPP_API_URL || "",
          whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
          metaVerifyToken: process.env.META_VERIFY_TOKEN || "",
          metaAppSecret: process.env.META_APP_SECRET || "",
        },
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden - Admin only" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const entries = body?.settings;

    if (!entries || typeof entries !== "object") {
      return NextResponse.json(
        { success: false, error: "settings object is required" },
        { status: 400 }
      );
    }

    const saved: Record<string, string> = {};
    for (const [key, value] of Object.entries(entries)) {
      if (typeof key !== "string") continue;
      const stringValue = value === null || value === undefined ? "" : String(value);
      saved[key] = stringValue;
      await prisma.setting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue },
      });
    }

    return NextResponse.json({ success: true, data: { saved } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 }
    );
  }
}