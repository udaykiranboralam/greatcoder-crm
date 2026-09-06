import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, interest, message } = body;

    if (!name || !phone || !interest) {
      return NextResponse.json(
        { error: "Name, phone, and interest are required." },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO enquiries (name, phone, interest, message)
      VALUES (${name}, ${phone}, ${interest}, ${message || null})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save enquiry:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}