import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CourseCardData {
  slug: string;
  name: string;
  shortDesc?: string | null;
  duration?: string | null;
  mode?: string | null;
  level?: string | null;
  icon?: string | null;
  price?: string | null;
  moduleCount?: number;
}

export function getModeLabel(mode?: string | null): string | null {
  if (!mode) return null;
  switch (mode.toUpperCase()) {
    case "ONLINE":
      return "Online";
    case "OFFLINE":
      return "Offline";
    case "HYBRID":
      return "Hybrid";
    default:
      return mode;
  }
}

const modeStyles: Record<string, string> = {
  Online: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Offline: "border-sky-200 bg-sky-50 text-sky-700",
  Hybrid: "border-violet-200 bg-violet-50 text-violet-700",
};

export default function CourseCard({ course }: { course: CourseCardData }) {
  const modeLabel = getModeLabel(course.mode);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full focus-visible:outline-none"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-red-200 group-hover:shadow-md">
        <CardContent className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            {course.icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-lg">
                {course.icon}
              </span>
            ) : (
              <BookOpen className="h-9 w-9 rounded-lg bg-red-50 p-1.5 text-red-600" />
            )}
            {modeLabel && (
              <Badge className={cn("border", modeStyles[modeLabel])}>
                {modeLabel}
              </Badge>
            )}
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">{course.name}</h3>
          {course.shortDesc && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
              {course.shortDesc}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {course.duration && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {course.duration}
              </span>
            )}
            {typeof course.moduleCount === "number" && course.moduleCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-slate-400" />
                {course.moduleCount} modules
              </span>
            )}
            {course.level && (
              <span className="text-xs text-slate-400">{course.level}</span>
            )}
          </div>

          {course.price && (
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {course.price}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
            View course
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}