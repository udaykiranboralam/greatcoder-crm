"use client";

import { useEffect, useState } from "react";
import { PhoneCall, Phone, RefreshCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime, timeAgo } from "@/lib/utils";

interface VoiceCallRecord {
  id: string;
  vapiCallId: string;
  leadId: string | null;
  direction: string;
  status: string;
  endedReason: string | null;
  durationSeconds: number | null;
  customerNumber: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  summary: string | null;
  costUsd: number | null;
  createdAt: string;
  lead?: { id: string; name: string | null; phone: string | null } | null;
}

interface LeadOption {
  id: string;
  name: string | null;
  phone: string | null;
}

const statusBadge: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  ringing: "bg-yellow-100 text-yellow-700",
  "in-progress": "bg-green-100 text-green-700",
  ended: "bg-blue-100 text-blue-700",
};

export default function VoiceAgentPage() {
  const { toast } = useToast();
  const [calls, setCalls] = useState<VoiceCallRecord[] | null>(null);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLead, setSelectedLead] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [calling, setCalling] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/voice/calls");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load");
      setCalls(json.data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/leads?limit=200");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load leads");
      const withPhone = (json.data || [])
        .filter((l: LeadOption) => l.phone)
        .map((l: LeadOption) => ({ id: l.id, name: l.name, phone: l.phone }));
      setLeads(withPhone);
    } catch {
      // ignore — manual number entry still works
    }
  };

  useEffect(() => {
    load();
    loadLeads();
  }, []);

  const placeCall = async () => {
    const phone = manualPhone.trim() || selectedLead;
    if (!selectedLead && !phone) {
      toast({ title: "Select a lead or enter a phone number", variant: "destructive" });
      return;
    }
    setCalling(true);
    try {
      const payload: Record<string, unknown> = {};
      if (selectedLead) payload.leadId = selectedLead;
      if (manualPhone.trim()) payload.phone = manualPhone.trim();

      const res = await fetch("/api/voice/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error || "Failed to place call", variant: "destructive" });
        return;
      }
      toast({ title: "Call initiated", description: "Priya is calling the number now." });
      setManualPhone("");
      setSelectedLead("");
      setTimeout(load, 3000);
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup status */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-[#DC2626]" />
            AI Voice Agent — Priya over the phone
          </CardTitle>
          <CardDescription>
            Handle inbound calls on your Vapi number and place outbound follow-up calls to
            leads. Call transcripts, summaries and recordings are saved to the lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Setup:</span> create an assistant in
            the Vapi dashboard using the Priya voice system prompt (same persona as the chat
            widget — give it your GreatCoder courses and admission details), assign a phone
            number, and set the webhook URL to{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
              {typeof window !== "undefined" ? window.location.origin : ""}/api/voice/webhook
            </code>{" "}
            with events <em>end-of-call-report</em>, <em>status-update</em> and{" "}
            <em>call-start</em>. Record the assistant and phone number IDs in your env as{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
              VAPI_ASSISTANT_ID
            </code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
              VAPI_PHONE_NUMBER_ID
            </code>
            .
          </p>
        </CardContent>
      </Card>

      {/* Place a call */}
      <Card>
        <CardHeader>
          <CardTitle>Place an outbound call</CardTitle>
          <CardDescription>
            Priya will call the lead, qualify them, and save the outcome automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="voice-lead">Lead</Label>
              <Select
                id="voice-lead"
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
              >
                <option value="">— Select a lead —</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name || "No name"} · {l.phone}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="voice-phone">Or type a phone number</Label>
              <Input
                id="voice-phone"
                placeholder="e.g. 9876543210"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={placeCall} disabled={calling}>
            {calling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            {calling ? "Calling..." : "Call now"}
          </Button>
        </CardContent>
      </Card>

      {/* Call history */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Call history</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : !calls ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No calls yet. Inbound calls to your Vapi number and outbound calls will appear
              here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Badge
                        variant={c.direction === "outbound" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {c.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      <span className="font-medium text-slate-900">
                        {c.lead?.name || c.customerNumber || "Unknown"}
                      </span>
                      <div className="text-xs text-slate-500">
                        {c.lead?.phone || c.customerNumber || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[c.status] || "bg-slate-100 text-slate-700"}`}
                      >
                        {c.status}
                      </span>
                      {c.endedReason ? (
                        <div className="mt-0.5 text-xs text-slate-500">{c.endedReason}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {c.durationSeconds ? `${Math.round(c.durationSeconds / 60)}m` : "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {c.costUsd != null ? `$${c.costUsd.toFixed(3)}` : "—"}
                    </TableCell>
                    <TableCell className="text-slate-500" title={formatDateTime(c.createdAt)}>
                      {timeAgo(c.createdAt)}
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