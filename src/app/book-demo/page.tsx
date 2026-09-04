"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const COURSES = [
  "DevOps",
  "DevSecOps",
  "Cyber Security",
  "Ethical Hacking",
  "Python Full Stack",
  "Java Full Stack",
  "Data Science",
  "Cloud Computing",
];

const MODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;

const STEPS = [
  "We verify your details over a call.",
  "We confirm your slot with the instructor.",
  "You attend your free session — online or at our Madhapur center.",
];

const formSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => value.replace(/[^\d]/g, "").length >= 10,
      "Phone number must have at least 10 digits"
    ),
  email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  course: z.string().min(1, "Please select a course"),
  preferredDate: z.string().min(1, "Please select a preferred date"),
  preferredTime: z.string().min(1, "Please select a preferred time"),
  mode: z.enum(MODES),
});

type FormValues = z.infer<typeof formSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p>;
}

function BookDemoForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      course: searchParams.get("course") ?? "",
      preferredDate: "",
      preferredTime: "",
      mode: "ONLINE",
    },
  });

  const selectedMode = watch("mode");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Booking failed. Please try again.");
      }
      toast({
        title: "Demo request received!",
        variant: "success",
        description:
          "Priya will call you shortly to confirm your free demo slot.",
      });
      reset({
        name: "",
        phone: "",
        email: "",
        course: "",
        preferredDate: "",
        preferredTime: "",
        mode: "ONLINE",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast({
        title: "Could not book your demo",
        variant: "destructive",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Book a Free Demo
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Pick a course and slot — our career counselor Priya will confirm
            your free demo over a call.
          </p>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Demo details</CardTitle>
              <CardDescription>
                All fields except email are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Ravi Kumar"
                      {...register("name")}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      {...register("phone")}
                    />
                    <FieldError message={errors.phone?.message} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("email")}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select id="course" {...register("course")}>
                    <option value="">Select a course</option>
                    {COURSES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={errors.course?.message} />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="preferredDate">Preferred date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      {...register("preferredDate")}
                    />
                    <FieldError message={errors.preferredDate?.message} />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred time</Label>
                    <Input
                      id="preferredTime"
                      type="time"
                      {...register("preferredTime")}
                    />
                    <FieldError message={errors.preferredTime?.message} />
                  </div>
                </div>

                <div>
                  <Label>Mode of learning</Label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {MODES.map((mode) => (
                      <label
                        key={mode}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                          selectedMode === mode
                            ? "border-red-600 bg-red-50 text-red-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="radio"
                          value={mode}
                          className="sr-only"
                          {...register("mode")}
                        />
                        {mode === "ONLINE"
                          ? "Online"
                          : mode === "OFFLINE"
                            ? "In-person (Madhapur)"
                            : "Hybrid"}
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.mode?.message} />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {submitting ? "Booking..." : "Book Free Demo"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-900">
              What happens next?
            </h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-600">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Need help choosing?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Tell Priya your background and goals — she'll recommend the right
              course.
            </p>
            <Link
              href="/career-counselor"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
            >
              Talk to Priya <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">
              Call for instant confirmation
            </p>
            <a
              href="tel:+919959011934"
              className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-slate-900 transition-colors hover:text-red-600"
            >
              <Phone className="h-4 w-4 text-red-600" /> 99590 11934
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function BookDemoPage() {
  return (
    <div className="bg-gray-50">
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-14 text-sm text-slate-500 sm:px-6 lg:px-8">
            Loading…
          </div>
        }
      >
        <BookDemoForm />
      </Suspense>
    </div>
  );
}