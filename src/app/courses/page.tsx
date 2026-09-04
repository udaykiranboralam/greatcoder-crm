import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { COURSE_MAPPINGS } from "@/lib/recommendation";
import CourseCard, { type CourseCardData } from "@/components/course-card";

export const metadata: Metadata = {
  title: "IT Courses in Hyderabad",
  description:
    "Browse industry-aligned DevOps, Cyber Security, Full Stack, Data Science and Cloud Computing courses at GreatCoder Trainings, Madhapur, Hyderabad.",
};

function mapCourses(
  courses: {
    slug: string;
    name: string;
    shortDesc: string | null;
    duration: string | null;
    mode: string;
    level: string | null;
    icon: string | null;
    price: unknown;
    modules: unknown[];
  }[]
): CourseCardData[] {
  return courses.map((course) => ({
    slug: course.slug,
    name: course.name,
    shortDesc: course.shortDesc,
    duration: course.duration,
    mode: course.mode,
    level: course.level,
    icon: course.icon,
    price:
      course.price != null
        ? `₹${Number(course.price).toLocaleString("en-IN")}`
        : null,
    moduleCount: course.modules.length,
  }));
}

function fallbackCourses(): CourseCardData[] {
  return COURSE_MAPPINGS.map((course) => ({
    slug: course.courseSlug,
    name: course.courseName,
    shortDesc: course.description,
    duration: "2-3 Months",
    mode: "OFFLINE",
    level: "Beginner to Advanced",
  }));
}

async function getCourses(): Promise<CourseCardData[]> {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: { modules: true },
      orderBy: { sortOrder: "asc" },
    });
    if (courses.length === 0) return fallbackCourses();
    return mapCourses(courses);
  } catch {
    return fallbackCourses();
  }
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="bg-gray-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Our Courses
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Practical, project-driven training in high-demand IT careers — taught
            by experts in Madhapur, Hyderabad.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-600">
              Courses are being onboarded. Talk to Priya to explore options.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}