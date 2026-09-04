"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PIE_COLORS = ["#DC2626", "#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"];
const BAR_COLORS = ["#DC2626", "#F97316", "#FACC15", "#A855F7", "#3B82F6", "#10B981", "#94A3B8", "#EF4444", "#64748B"];

interface TrendPoint {
  date: string;
  count: number;
}

interface SourcePoint {
  source: string;
  count: number;
}

interface StatusPoint {
  status: string;
  count: number;
}

interface Funnel {
  totalLeads: number;
  demoScheduled: number;
  demosAttended: number;
  converted: number;
}

interface AnalyticsData {
  leadsPerDay: TrendPoint[];
  sourceDistribution: SourcePoint[];
  statusDistribution: StatusPoint[];
  conversionFunnel: Funnel | null;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load analytics");
          return;
        }
        setData(json.data);
      } catch {
        setError("Failed to load analytics");
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const hasLeads = (data.leadsPerDay || []).some((p) => p.count > 0);
  const sourceData = data.sourceDistribution || [];
  const statusData = data.statusDistribution || [];
  const funnel = data.conversionFunnel;

  const funnelSteps = funnel
    ? [
        { name: "Total Leads", value: funnel.totalLeads },
        { name: "Demo Scheduled", value: funnel.demoScheduled },
        { name: "Demos Attended", value: funnel.demosAttended },
        { name: "Converted", value: funnel.converted },
      ]
    : [];

  const maxFunnel = Math.max(
    funnel?.totalLeads || 1,
    funnelSteps.length ? funnelSteps[0].value : 1,
    1
  );

  return (
    <div className="space-y-6">
      {/* Leads per day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leads Per Day (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasLeads ? (
            <p className="py-16 text-center text-sm text-slate-500">
              No leads in the last 14 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={data.leadsPerDay}
                margin={{ top: 5, right: 20, bottom: 5, left: -10 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Leads"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Source distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">
                No source data.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: { name?: string }) => e.name ?? ""}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell
                        key={entry.source}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-500">
                No status data.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={statusData}
                  margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
                >
                  <XAxis
                    dataKey="status"
                    tickFormatter={(s) => String(s).replace(/_/g, " ")}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {funnel && funnel.totalLeads > 0 ? (
            <div className="space-y-3">
              {funnelSteps.map((step, i) => (
                <div key={step.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{step.name}</span>
                    <span className="text-slate-500">
                      {step.value}
                      {i > 0
                        ? ` · ${Math.round((step.value / funnel.totalLeads) * 100)}%`
                        : ""}
                    </span>
                  </div>
                  <div className="h-6 w-full overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-red-500 to-red-700 transition-all"
                      style={{
                        width: `${Math.round((step.value / maxFunnel) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              Not enough data to build a conversion funnel yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}