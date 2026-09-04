import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const followUp = await prisma.followUp.findUnique({
      where: { id: params.id },
    });

    if (!followUp) {
      return NextResponse.json(
        { success: false, error: "Follow-up not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status, priority, note, completedById } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (note !== undefined) updateData.note = note;
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
      if (completedById) updateData.completedById = completedById;
    }

    const updated = await prisma.followUp.update({
      where: { id: params.id },
      data: updateData,
      include: { lead: true, createdBy: true, completedBy: true },
    });

    await prisma.activityLog.create({
      data: {
        leadId: followUp.leadId,
        type: "FOLLOW_UP_UPDATED",
        action: `Follow-up status updated to ${status || followUp.status}`,
        metadata: { followUpId: params.id, ...body },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update follow-up",
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
    const followUp = await prisma.followUp.findUnique({
      where: { id: params.id },
    });

    if (!followUp) {
      return NextResponse.json(
        { success: false, error: "Follow-up not found" },
        { status: 404 }
      );
    }

    await prisma.followUp.delete({ where: { id: params.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Follow-up deleted successfully" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete follow-up",
      },
      { status: 500 }
    );
  }
}