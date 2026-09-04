import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        modules: {
          include: { topics: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        faqs: { orderBy: { order: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
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

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Course name is required" },
        { status: 400 }
      );
    }

    const finalSlug = slug || slugify(name);
    if (!finalSlug) {
      return NextResponse.json(
        { success: false, error: "Could not generate a course slug" },
        { status: 400 }
      );
    }

    const existing = await prisma.course.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A course with this slug already exists" },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        slug: finalSlug,
        shortDesc: shortDesc || null,
        description: description || null,
        duration: duration || null,
        price: price === "" || price === null ? null : price,
        mode: mode || "OFFLINE",
        level: level || null,
        prerequisites: prerequisites || null,
        image: image || null,
        icon: icon || null,
        isActive: isActive === undefined ? true : Boolean(isActive),
        featured: featured === undefined ? false : Boolean(featured),
        sortOrder:
          sortOrder === undefined || sortOrder === null ? 0 : Number(sortOrder),
      },
      include: {
        modules: {
          include: { topics: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        faqs: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create course",
      },
      { status: 500 }
    );
  }
}