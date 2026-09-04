import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const demo = await prisma.demo.findUnique({ where: { id: params.id } });

    if (!demo) {
      return NextResponse.json(
        { success: false, error: "Demo not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status, notes, scheduledAt, mode, completedById } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (mode !== undefined) updateData.mode = mode;
    if (status === "COMPLETED") {
      updateData.convertedAt = new Date();
      if (completedById) updateData.completedById = completedById;
    }

    const updated = await prisma.demo.update({
      where: { id: params.id },
      data: updateData,
      include: { lead: true, course: true },
    });

    await prisma.activityLog.create({
      data: {
        leadId: demo.leadId,
        type: "DEMO_UPDATED",
        action: `Demo status updated to ${status || demo.status}`,
        metadata: { demoId: params.id, ...body },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update demo",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const demo = await prisma.demo.findUnique({ where: { id: params.id } });

    if (!demo) {
      return NextResponse.json(
        { success: false, error: "Demo not found" },
        { status: 404 }
      );
    }

    await prisma.demo.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Demo deleted successfully" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete demo",
      },
      { status: 500 }
    );
  }
}