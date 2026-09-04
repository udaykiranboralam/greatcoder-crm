"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Lightbulb,
  Gauge,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { TemperatureBadge } from "@/components/admin/temperature-badge";
import { LeadStatusBadge } from "@/components/admin/lead-status-badge";
import {
  maskPhone,
  formatDateTime,
  timeAgo,
  getScoreColor,
} from "@/lib/utils";

const STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SCHEDULED",
  "FOLLOW_UP",
  "CONVERTED",
  "NOT_INTERESTED",
  "INVALID",
];

interface ScoreResult {
  score: number;
  temperature: string;
  intentLevel: string;
  sentiment: string;
  recommendedNextAction: string;
  probabilityDemoBooking: number;
  probabilityAdmission: number;
  breakdown: Record<string, number>;
}

interface Recommendation {
  courseName: string;
  confidence: number;
  reasoning: string;
  alternatives: { courseName: string; confidence: number; reason: string }[];
}

interface LeadDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  qualification: string | null;
  experience: string | null;
  currentRole: string | null;
  currentLocation: string | null;
  careerGoal: string | null;
  budget: string | null;
  source: string;
  status: string;
  temperature: string;
  leadScore: number;
  notes: string | null;
  interestedCourse: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
  conversations: { id: string; lastMessageAt: string; channel: string }[];
  demos: { id: string; courseId: string | null; scheduledAt: string; mode: string; status: string; notes: string | null }[];
  followUps: { id: string; scheduledFor: string; status: string; priority: string; note: string | null }[];
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  channel: string;
  status: string;
  language: string | null;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/leads/${params.id}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load lead");
          return;
        }
        setLead(json.data);
        setNotes(json.data.notes || "");
      } catch {
        setError("Failed to load lead");
      }
    };
    load();
  }, [params.id]);

  useEffect(() => {
    if (!params.id || !lead) return;
    const loadScore = async () => {
      try {
        const res = await fetch(`/api/leads/${params.id}/score`);
        const json = await res.json();
        if (res.ok) setScore(json.data);
      } catch {
        // ignore score errors
      }
    };
    const loadRecommendation = async () => {
      try {
        const res = await fetch(`/api/leads/${params.id}/recommendation`);
        const json = await res.json();
        if (res.ok) setRecommendation(json.data);
      } catch {
        // ignore
      }
    };
    const loadConversation = async () => {
      const convId = lead.conversations?.[0]?.id;
      if (!convId) return;
      try {
        const res = await fetch(`/api/conversations/${convId}`);
        const json = await res.json();
        if (res.ok) setConversation(json.data);
      } catch {
        // ignore
      }
    };
    loadScore();
    loadRecommendation();
    loadConversation();
  }, [params.id, lead]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast({ title: "Failed to update status", variant: "destructive" });
      return;
    }
    setLead({ ...lead, status });
    toast({ title: "Status updated" });
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
    if (!res.ok) {
      toast({ title: "Failed to save notes", variant: "destructive" });
      return;
    }
    toast({ title: "Notes saved" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {lead.name || "Unnamed Lead"}
            </h2>
            <p className="text-sm text-slate-500">
              Created {formatDateTime(lead.createdAt)} · Source: {lead.source}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TemperatureBadge temperature={lead.temperature} />
          <LeadStatusBadge status={lead.status} />
          <div className="w-48">
            <Select
              aria-label="Update status"
              value={lead.status}
              onChange={(e) => updateStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <Tabs value="overview" onValueChange={() => {}} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="demos">Demos</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Lead Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {[
                    { label: "Phone", value: maskPhone(lead.phone) },
                    { label: "WhatsApp", value: maskPhone(lead.whatsapp) },
                    { label: "Email", value: lead.email || "—" },
                    { label: "Qualification", value: lead.qualification || "—" },
                    { label: "Experience", value: lead.experience || "—" },
                    { label: "Current Role", value: lead.currentRole || "—" },
                    { label: "Location", value: lead.currentLocation || "—" },
                    { label: "Interested Course", value: lead.interestedCourse?.name || "—" },
                    { label: "Career Goal", value: lead.careerGoal || "—" },
                    { label: "Budget", value: lead.budget || "—" },
                    { label: "Assigned To", value: lead.assignedTo?.name || "—" },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs font-medium uppercase text-slate-400">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-sm text-slate-800">{row.value}</dd>
                    </div>
                  ))}
                </dl>

                <Separator className="my-6" />

                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-slate-400">
                    Notes
                  </p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this lead..."
                    rows={4}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={saveNotes} disabled={savingNotes}>
                      {savingNotes ? "Saving..." : "Save Notes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gauge className="h-4 w-4 text-red-600" />
                    Lead Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!score ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <div>
                      <div className="flex items-end gap-2">
                        <span
                          className={`text-4xl font-bold ${getScoreColor(score.score)}`}
                        >
                          {score.score}
                        </span>
                        <span className="pb-1 text-sm text-slate-400">/100</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">Intent: {score.intentLevel}</Badge>
                        <Badge variant="secondary">Sentiment: {score.sentiment}</Badge>
                      </div>
                      <div className="mt-4 space-y-2">
                        {Object.entries(score.breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-slate-500">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </span>
                            <span className="font-medium text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-md bg-slate-50 p-3 text-center">
                          <p className="text-lg font-bold text-slate-900">
                            {Math.round(score.probabilityDemoBooking * 100)}%
                          </p>
                          <p className="text-xs text-slate-500">Demo booking</p>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3 text-center">
                          <p className="text-lg font-bold text-slate-900">
                            {Math.round(score.probabilityAdmission * 100)}%
                          </p>
                          <p className="text-xs text-slate-500">Admission</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-4 w-4 text-red-600" />
                    Recommended Next Action
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!score ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <p className="text-sm text-slate-700">
                      {score.recommendedNextAction}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Recommendation</CardTitle>
                  <CardDescription>AI-based course suggestion</CardDescription>
                </CardHeader>
                <CardContent>
                  {!recommendation ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {recommendation.courseName}
                        </span>
                        <Badge variant="secondary">{recommendation.confidence}%</Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {recommendation.reasoning}
                      </p>
                      {recommendation.alternatives?.length ? (
                        <div className="space-y-1">
                          {recommendation.alternatives.map((alt) => (
                            <div
                              key={alt.courseName}
                              className="rounded-md border border-slate-200 p-2 text-sm"
                            >
                              <span className="font-medium text-slate-800">
                                {alt.courseName}
                              </span>
                              <span className="ml-2 text-xs text-slate-400">
                                {alt.confidence}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquareText className="h-4 w-4 text-red-600" />
                Conversation History
              </CardTitle>
              <CardDescription>
                {conversation
                  ? `${conversation.channel} · last message ${timeAgo(conversation.lastMessageAt)}`
                  : "No conversation yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!conversation ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  {score?.recommendedNextAction ||
                    "No conversation history available. Use the score breakdown above to guide your next step."}
                </p>
              ) : (
                <div className="max-h-[36rem] space-y-3 overflow-y-auto">
                  {conversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] rounded-lg border p-3 text-sm ${
                        msg.role === "user"
                          ? "ml-auto border-slate-200 bg-slate-50"
                          : "border-red-100 bg-red-50"
                      }`}
                    >
                      <p className="text-slate-800">{msg.content}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {msg.role} · {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduled Demos</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.demos.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No demos scheduled for this lead.
                </p>
              ) : (
                <div className="space-y-3">
                  {lead.demos.map((demo) => (
                    <div
                      key={demo.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateTime(demo.scheduledAt)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {demo.mode} · {demo.notes || "No notes"}
                        </p>
                      </div>
                      <Badge variant="secondary">{demo.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.followUps.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  No follow-ups for this lead.
                </p>
              ) : (
                <div className="space-y-3">
                  {lead.followUps.map((fu) => (
                    <div
                      key={fu.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDateTime(fu.scheduledFor)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {fu.priority} priority · {fu.note || "No note"}
                        </p>
                      </div>
                      <Badge variant="secondary">{fu.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}