"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  PlusCircle,
  Flame,
  Sun,
  Snowflake,
  CalendarClock,
  TrendingUp,
  BellRing,
  Gauge,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/admin/stat-card";
import { TemperatureBadge } from "@/components/admin/temperature-badge";
import { LeadStatusBadge } from "@/components/admin/lead-status-badge";
import { maskPhone, timeAgo, getScoreColor } from "@/lib/utils";

interface Stats {
  totalLeads: number;
  newLeadsToday: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  demoScheduled: number;
  demosToday: number;
  conversions: number;
  pendingFollowUps: number;
  avgLeadScore: number;
}

interface LeadRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  interestedCourse: { id: string; name: string } | null;
  temperature: string;
  status: string;
  leadScore: number;
  source: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, leadsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/leads"),
        ]);
        const statsJson = await statsRes.json();
        const leadsJson = await leadsRes.json();
        if (!statsRes.ok || !leadsRes.ok) {
          setError(statsJson.error || leadsJson.error || "Failed to load data");
          return;
        }
        setStats(statsJson.data);
        setLeads(leadsJson.data);
      } catch {
        setError("Failed to load dashboard data");
      }
    };
    load();
  }, []);

  const hotLeads = (leads || []).filter((l) => l.temperature === "HOT");

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {!stats
          ? Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-3 h-8 w-12" />
                </CardContent>
              </Card>
            ))
          : [
              { label: "Total Leads", value: stats.totalLeads, icon: Users },
              {
                label: "New Today",
                value: stats.newLeadsToday,
                icon: PlusCircle,
              },
              {
                label: "Hot",
                value: stats.hotLeads,
                icon: Flame,
                iconClassName: "bg-red-50 text-red-600",
              },
              {
                label: "Warm",
                value: stats.warmLeads,
                icon: Sun,
                iconClassName: "bg-orange-50 text-orange-600",
              },
              {
                label: "Cold",
                value: stats.coldLeads,
                icon: Snowflake,
                iconClassName: "bg-blue-50 text-blue-600",
              },
              {
                label: "Demos Scheduled",
                value: stats.demoScheduled,
                icon: CalendarClock,
              },
              {
                label: "Demos Today",
                value: stats.demosToday,
                icon: CalendarClock,
              },
              {
                label: "Conversions",
                value: stats.conversions,
                icon: TrendingUp,
                iconClassName: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Pending Follow-ups",
                value: stats.pendingFollowUps,
                icon: BellRing,
              },
              {
                label: "Avg Score",
                value: stats.avgLeadScore,
                icon: Gauge,
              },
            ].map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                iconClassName={s.iconClassName}
              />
            ))}
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {/* Hot leads CTA */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {hotLeads.length > 0
                  ? `${hotLeads.length} hot lead${hotLeads.length === 1 ? "" : "s"} need attention`
                  : "No hot leads right now"}
              </h3>
              <p className="text-sm text-slate-500">
                Hot leads have a score of 75+. Prioritize calling them today.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/leads?temperature=HOT">
              <Button variant="outline" size="sm">
                View Hot Leads
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Leads</CardTitle>
          <Link href="/admin/leads">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!leads ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No leads yet. Leads created through the chatbot or website will
              appear here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.slice(0, 8).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium text-slate-900">
                      {lead.name || "Unnamed"}
                    </TableCell>
                    <TableCell>{maskPhone(lead.phone)}</TableCell>
                    <TableCell className="text-slate-600">
                      {lead.interestedCourse?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <TemperatureBadge temperature={lead.temperature} />
                    </TableCell>
                    <TableCell>
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${getScoreColor(lead.leadScore)}`}
                      >
                        {lead.leadScore}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {timeAgo(lead.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}