import Link from "next/link";
import { GraduationCap, ArrowRight, CalendarClock, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "Industry-Aligned Courses",
    desc: "DevOps, Cyber Security, Full Stack, Data Science & more — built around what employers hire for.",
    icon: GraduationCap,
  },
  {
    title: "Expert Mentors",
    desc: "Learn from working professionals with real-world project experience.",
    icon: Users,
  },
  {
    title: "Free Demo Classes",
    desc: "Attend a free session before you decide — online or at our Madhapur center.",
    icon: CalendarClock,
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Start Your IT Career at{" "}
              <span className="text-red-500">GreatCoder Trainings</span>
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Hands-on training in DevOps, Cybersecurity, Full Stack, Data
              Science and Cloud Computing. Based in Madhapur, Hyderabad — with a
              free AI career counselor to guide you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/career-counselor">
                <Button size="lg" variant="outline" className="bg-transparent">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat with Counselor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}