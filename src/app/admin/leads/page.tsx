"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemperatureBadge } from "@/components/admin/temperature-badge";
import { LeadStatusBadge } from "@/components/admin/lead-status-badge";
import { maskPhone, formatDate, getScoreColor } from "@/lib/utils";

const tempOptions = ["ALL", "HOT", "WARM", "COLD"];
const statusOptions = [
  "ALL",
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SCHEDULED",
  "FOLLOW_UP",
  "CONVERTED",
  "NOT_INTERESTED",
  "INVALID",
];

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

export default function AdminLeadsPage() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState(
    searchParams.get("temperature") || "ALL"
  );
  const [status, setStatus] = useState("ALL");

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

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (temperature !== "ALL" && lead.temperature !== temperature) return false;
      if (status !== "ALL" && lead.status !== status) return false;
      if (!q) return true;
      return (
        (lead.name || "").toLowerCase().includes(q) ||
        (lead.phone || "").includes(q) ||
        (lead.email || "").toLowerCase().includes(q)
      );
    });
  }, [leads, search, temperature, status]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                label=""
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className="w-36"
              >
                {tempOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All temperatures" : t}
                  </option>
                ))}
              </Select>
              <Select
                label=""
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-40"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
              <Link href="/api/leads/export">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {!leads ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-slate-500">
                      No leads found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium text-slate-900">
                        {lead.name || "Unnamed"}
                      </TableCell>
                      <TableCell>{maskPhone(lead.phone)}</TableCell>
                      <TableCell className="text-slate-600">
                        {lead.interestedCourse?.name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {lead.source}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${getScoreColor(lead.leadScore)}`}
                        >
                          {lead.leadScore}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TemperatureBadge temperature={lead.temperature} />
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/leads/${lead.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}