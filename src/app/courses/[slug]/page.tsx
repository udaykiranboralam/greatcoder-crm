import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COURSE_MAPPINGS } from "@/lib/recommendation";
import { Badge } from "@/components/ui/badge";
import { getModeLabel } from "@/components/course-card";
import {
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseDetailData {
  slug: string;
  name: string;
  shortDesc: string | null;
  description: string | null;
  duration: string | null;
  price: string | null;
  mode: string | null;
  level: string | null;
  prerequisites: string | null;
  icon: string | null;
  modules: {
    title: string;
    description: string | null;
    topics: { title: string; duration: string | null }[];
  }[];
  faqs: { question: string; answer: string }[];
  reviews: { name: string; rating: number; comment: string | null }[];
}

const fallbackModules = (courseName: string, idealFor: string[]) => [
  {
    title: "Course Foundations",
    description: `Core concepts and fundamentals of ${courseName}.`,
    topics: [
      { title: `Introduction to ${courseName}`, duration: null },
      { title: "Industry overview & career paths", duration: null },
      { title: "Setting up your learning environment", duration: null },
    ],
  },
  {
    title: "Core Skills & Tools",
    description: `Hands-on practice with the tools and skills used on the job as a ${courseName} professional.`,
    topics: [
      ...idealFor.map((role) => ({
        title: role,
        duration: null as string | null,
      })),
    ],
  },
  {
    title: "Projects & Placement Prep",
    description: "Apply your learning to real-world projects with placement support.",
    topics: [
      { title: "Capstone project", duration: null },
      { title: "Resume review & mock interviews", duration: null },
    ],
  },
];

function buildFallbackDetail(
  mapping: {
    courseSlug: string;
    courseName: string;
    description: string;
    idealFor: string[];
  }
): CourseDetailData {
  return {
    slug: mapping.courseSlug,
    name: mapping.courseName,
    shortDesc: mapping.description,
    description: mapping.description,
    duration: "2-3 Months",
    price: null,
    mode: "OFFLINE",
    level: "Beginner to Advanced",
    prerequisites: null,
    icon: null,
    modules: fallbackModules(mapping.courseName, mapping.idealFor),
    faqs: [
      {
        question: `Is ${mapping.courseName} the right course for me?`,
        answer:
          mapping.idealFor.length > 0
            ? `It is ideal for roles like ${mapping.idealFor.slice(0, 3).join(", ")}. Not sure? Talk to Priya and we'll map it to your background and goals.`
            : "Yes — it is designed around current industry demand.",
      },
      {
        question: "Do you provide placement assistance?",
        answer:
          "Yes. We provide resume building, mock interviews, and placement assistance as part of your training journey.",
      },
      {
        question: "Can I attend a free demo first?",
        answer:
          "Absolutely. Book a free demo to meet the instructor and experience the class before you decide.",
      },
    ],
    reviews: [],
  };
}

async function getCourse(slug: string): Promise<CourseDetailData | null> {
  let dbCourse: {
    slug: string;
    name: string;
    shortDesc: string | null;
    description: string | null;
    duration: string | null;
    price: unknown;
    mode: string;
    level: string | null;
    prerequisites: string | null;
    icon: string | null;
    modules: {
      title: string;
      description: string | null;
      topics: { title: string; duration: string | null }[];
    }[];
    faqs: { question: string; answer: string }[];
    reviews: { name: string; rating: number; comment: string | null }[];
  } | null = null;
  try {
    dbCourse = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { topics: { orderBy: { order: "asc" } } },
        },
        faqs: { orderBy: { order: "asc" } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    dbCourse = null;
  }

  if (dbCourse) {
    return {
      slug: dbCourse.slug,
      name: dbCourse.name,
      shortDesc: dbCourse.shortDesc,
      description: dbCourse.description,
      duration: dbCourse.duration,
      price:
        dbCourse.price != null
          ? `₹${Number(dbCourse.price).toLocaleString("en-IN")}`
          : null,
      mode: dbCourse.mode,
      level: dbCourse.level,
      prerequisites: dbCourse.prerequisites,
      icon: dbCourse.icon,
      modules: dbCourse.modules.map((module) => ({
        title: module.title,
        description: module.description,
        topics: module.topics.map((topic) => ({
          title: topic.title,
          duration: topic.duration,
        })),
      })),
      faqs: dbCourse.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
      reviews: dbCourse.reviews.map((review) => ({
        name: review.name,
        rating: review.rating,
        comment: review.comment,
      })),
    };
  }

  const mapping = COURSE_MAPPINGS.find(
    (course) => course.courseSlug === slug || course.aliases.includes(slug)
  );
  if (mapping) return buildFallbackDetail(mapping);

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) {
    return { title: "Course Not Found" };
  }
  return {
    title: `${course.name} Course in Hyderabad`,
    description:
      course.shortDesc || course.description || undefined,
  };
}

const ctaPrimary =
  "flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700";
const ctaSecondary =
  "mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50";

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const modeLabel = getModeLabel(course.mode);

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="border-b border-slate-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="text-sm text-slate-500">
            <Link href="/courses" className="transition-colors hover:text-red-600">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">{course.name}</span>
          </nav>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                <span className="hidden h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 sm:flex">
                  {course.icon ? (
                    <span className="text-2xl">{course.icon}</span>
                  ) : (
                    <GraduationCap className="h-6 w-6 text-red-600" />
                  )}
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  {course.name}
                </h1>
              </div>
              {course.shortDesc && (
                <p className="mt-4 text-lg text-slate-600">{course.shortDesc}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {course.duration && (
                  <Badge variant="secondary">{course.duration}</Badge>
                )}
                {modeLabel && (
                  <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                    {modeLabel}
                  </Badge>
                )}
                {course.level && (
                  <Badge variant="secondary">{course.level}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Mobile CTA card */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:hidden">
            <p className="text-sm font-medium text-slate-500">Course Fee</p>
            {course.price ? (
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                {course.price}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Contact admissions for latest fee
              </p>
            )}
            <Link href={`/book-demo?course=${course.slug}`} className={ctaPrimary}>
              Book Free Demo
            </Link>
            <Link href="/career-counselor" className={ctaSecondary}>
              <MessageCircle className="h-4 w-4" />
              Chat with Priya
            </Link>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-12">
            {course.description && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  About this course
                </h2>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-700">
                  {course.description}
                </p>
              </div>
            )}

            {course.prerequisites && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Prerequisites
                </h2>
                <p className="mt-4 leading-relaxed text-slate-700">
                  {course.prerequisites}
                </p>
              </div>
            )}

            {course.modules.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Course curriculum
                </h2>
                <div className="mt-6 space-y-4">
                  {course.modules.map((module, index) => (
                    <div
                      key={`${module.title}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900">
                          {module.title}
                        </h3>
                      </div>
                      {module.description && (
                        <p className="mt-3 text-sm text-slate-600">
                          {module.description}
                        </p>
                      )}
                      {module.topics.length > 0 && (
                        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                          {module.topics.map((topic) => (
                            <li
                              key={topic.title}
                              className="flex items-start gap-2 text-sm text-slate-700"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                              <span>
                                {topic.title}
                                {topic.duration && (
                                  <span className="ml-1 text-xs text-slate-400">
                                    · {topic.duration}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.faqs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Frequently asked questions
                </h2>
                <div className="mt-6 space-y-3">
                  {course.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="group rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900">
                        {faq.question}
                        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {course.reviews.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  What students say
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {course.reviews.map((review) => (
                    <div
                      key={`${review.name}-${review.rating}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "h-4 w-4",
                              index < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">
                        {review.comment || "Great learning experience."}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {review.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-gray-50 p-6">
              <p className="text-sm font-medium text-slate-500">Course Fee</p>
              {course.price ? (
                <p className="mt-1 text-3xl font-extrabold text-slate-900">
                  {course.price}
                </p>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  Contact admissions for latest fee
                </p>
              )}
              <Link href={`/book-demo?course=${course.slug}`} className={ctaPrimary}>
                Book Free Demo
              </Link>
              <Link href="/career-counselor" className={ctaSecondary}>
                <MessageCircle className="h-4 w-4" />
                Chat with Priya
              </Link>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-500">
                  Admissions & inquiries
                </p>
                <a
                  href="tel:+919959011934"
                  className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors hover:text-red-600"
                >
                  <Phone className="h-4 w-4 text-red-600" />
                  +91 99590 11934
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  Madhapur, Hyderabad
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}