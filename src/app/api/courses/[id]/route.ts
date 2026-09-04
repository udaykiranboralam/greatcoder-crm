import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        modules: {
          include: { topics: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        faqs: { orderBy: { order: "asc" } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch course",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.course.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      shortDesc,
      description,
      duration,
      price,
      mode,
      level,
      prerequisites,
      image,
      icon,
      isActive,
      featured,
      sortOrder,
    } = body;

    let finalSlug = slug;
    if (!finalSlug && name) {
      finalSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    if (finalSlug && finalSlug !== existing.slug) {
      const conflict = await prisma.course.findUnique({
        where: { slug: finalSlug },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: "A course with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const course = await prisma.course.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(finalSlug ? { slug: finalSlug } : {}),
        ...(shortDesc !== undefined ? { shortDesc: shortDesc || null } : {}),
        ...(description !== undefined
          ? { description: description || null }
          : {}),
        ...(duration !== undefined ? { duration: duration || null } : {}),
        ...(price !== undefined
          ? { price: price === "" || price === null ? null : price }
          : {}),
        ...(mode !== undefined ? { mode: mode || "OFFLINE" } : {}),
        ...(level !== undefined ? { level: level || null } : {}),
        ...(prerequisites !== undefined
          ? { prerequisites: prerequisites || null }
          : {}),
        ...(image !== undefined ? { image: image || null } : {}),
        ...(icon !== undefined ? { icon: icon || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
        ...(sortOrder !== undefined && sortOrder !== null
          ? { sortOrder: Number(sortOrder) }
          : {}),
      },
      include: {
        modules: {
          include: { topics: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        faqs: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update course",
      },
      { status: 500 }
    );
  }
}