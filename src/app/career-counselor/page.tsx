"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Bubble {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Bubble = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm Priya, your career counselor at GreatCoder Trainings. Tell me your background and goals, and I'll suggest the right course, fees and free demo options.",
};

const OFFERINGS = [
  "Personalised course roadmap",
  "Free demo class booking",
  "Fee & scholarship guidance",
  "Mock interviews & placement tips",
];

function fallbackReply(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("fee") ||
    lower.includes("cost") ||
    lower.includes("price")
  ) {
    return "Fees vary by course and mode (online/offline). For the latest fee structure, call our admissions team at 99590 11934 or book a free demo.";
  }
  if (lower.includes("demo")) {
    return "You can book a free demo from the 'Book Demo' page — pick your course and preferred slot, and our team will confirm it shortly.";
  }
  return "Thank you — I've noted your query for our admissions team. Call 99590 11934 for immediate help, or book a free demo.";
}

export default function CareerCounselorPage() {
  const [messages, setMessages] = useState<Bubble[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: text },
    ]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const data = (await res.json()) as { reply?: string };
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            typeof data.reply === "string" && data.reply
              ? data.reply
              : fallbackReply(text),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fallbackReply(text),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            <Sparkles className="h-3.5 w-3.5" />
            Free AI career guidance
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Talk to Priya
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Get a personalised course plan based on your background, goals and
            budget — then book a free demo in minutes.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Chat panel */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-900 px-5 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-600 text-base font-bold text-white">
                    P
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-white">Priya</p>
                  <p className="text-xs text-slate-400">
                    Career Counselor · GreatCoder Trainings
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>

              <div
                ref={scrollRef}
                className="h-[520px] space-y-4 overflow-y-auto bg-gray-50 px-5 py-5"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-sm bg-red-600 px-4 py-2.5 text-sm text-white"
                          : "max-w-[85%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400">
                      Priya is typing…
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. I'm a B.Tech graduate interested in DevOps"
                    className="h-11"
                    aria-label="Chat message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-11 w-11"
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <p className="mt-3 text-xs text-slate-400">
                  Priya is an AI assistant. For immediate admissions support,
                  call 99590 11934.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                What we offer
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {OFFERINGS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Priya's role</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Priya helps you understand career paths, pick the right course
                based on your background, and book a free demo — so you can
                start with confidence.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 text-white">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-bold">Ready to start?</h2>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Book a free demo session with a live instructor.
              </p>
              <Link
                href="/book-demo"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Book Free Demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500">Prefer to talk?</p>
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
    </div>
  );
}