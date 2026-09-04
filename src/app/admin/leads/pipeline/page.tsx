"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { TemperatureBadge } from "@/components/admin/temperature-badge";
import { maskPhone, getScoreColor } from "@/lib/utils";

const STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SCHEDULED",
  "FOLLOW_UP",
  "CONVERTED",
  "NOT_INTERESTED",
  "INVALID",
];

interface PipelineLead {
  id: string;
  name: string | null;
  phone: string | null;
  leadScore: number;
  temperature: string;
  status: string;
}

export default function LeadPipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/leads");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load leads");
          return;
        }
        setLeads(json.data);
      } catch {
        setError("Failed to load leads");
      }
    };
    load();
  }, []);

  const moveLead = async (id: string, status: string) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast({ title: "Failed to update status", variant: "destructive" });
      return;
    }
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === id ? { ...l, status } : l)) : prev
    );
    toast({ title: "Status updated" });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {!leads ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const columnLeads = leads.filter((l) => l.status === status);
            return (
              <div
                key={status}
                className="w-72 shrink-0 rounded-lg bg-slate-100 p-3"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {status.replace(/_/g, " ")}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {columnLeads.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnLeads.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                      No leads
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <Card key={lead.id} className="bg-white">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                href={`/admin/leads/${lead.id}`}
                                className="block truncate text-sm font-medium text-slate-900 hover:text-red-600"
                              >
                                {lead.name || "Unnamed"}
                              </Link>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {maskPhone(lead.phone)}
                              </p>
                            </div>
                            <span
                              className={`text-sm font-bold ${getScoreColor(lead.leadScore)}`}
                            >
                              {lead.leadScore}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <TemperatureBadge temperature={lead.temperature} />
                            <Select
                              aria-label="Move lead"
                              value={lead.status}
                              onChange={(e) =>
                                moveLead(lead.id, e.target.value)
                              }
                              className="h-8 w-36 text-xs"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace(/_/g, " ")}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Link href="/admin/leads">
          <Button variant="ghost" size="sm">
            Back to table
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}