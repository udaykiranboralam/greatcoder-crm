"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime, timeAgo } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-700",
};

interface FollowUpRow {
  id: string;
  scheduledFor: string;
  status: string;
  priority: string;
  note: string | null;
  lead: { id: string; name: string | null; phone: string | null };
}

interface LeadOption {
  id: string;
  name: string | null;
  phone: string | null;
}

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [followUps, setFollowUps] = useState<FollowUpRow[] | null>(null);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    leadId: "",
    scheduledFor: "",
    priority: "MEDIUM",
    note: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [fuRes, leadsRes] = await Promise.all([
          fetch("/api/follow-ups"),
          fetch("/api/leads"),
        ]);
        const fuJson = await fuRes.json();
        const leadsJson = await leadsRes.json();
        if (!fuRes.ok) {
          setError(fuJson.error || "Failed to load follow-ups");
          return;
        }
        setFollowUps(fuJson.data);
        if (leadsRes.ok) setLeads(leadsJson.data);
      } catch {
        setError("Failed to load follow-ups");
      }
    };
    load();
  }, []);

  const visible = useMemo(() => {
    if (!followUps) return [];
    return followUps
      .filter((f) => (showCompleted ? true : f.status === "PENDING"))
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );
  }, [followUps, showCompleted]);

  const complete = async (id: string) => {
    const res = await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (!res.ok) {
      toast({ title: "Failed to complete follow-up", variant: "destructive" });
      return;
    }
    setFollowUps((prev) =>
      prev ? prev.map((f) => (f.id === id ? { ...f, status: "COMPLETED" } : f)) : prev
    );
    toast({ title: "Follow-up completed" });
  };

  const createFollowUp = async () => {
    if (!form.leadId || !form.scheduledFor) {
      toast({
        title: "Lead and scheduled time are required",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Failed to create follow-up", variant: "destructive" });
      return;
    }
    const json = await res.json();
    setFollowUps((prev) => (prev ? [...prev, json.data] : prev));
    setDialogOpen(false);
    setForm({ leadId: "", scheduledFor: "", priority: "MEDIUM", note: "" });
    toast({ title: "Follow-up created" });
  };

  const overdue = (scheduledFor: string) =>
    new Date(scheduledFor).getTime() <= Date.now();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
            id="show-completed"
          />
          <Label htmlFor="show-completed">Show completed</Label>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Follow-up
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {!followUps ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No {showCompleted ? "follow-ups" : "pending follow-ups"}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((fu) => (
            <Card key={fu.id} className={fu.status === "PENDING" && overdue(fu.scheduledFor) ? "border-red-200" : ""}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {fu.lead?.name || "Unknown lead"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(fu.scheduledFor)} ·{" "}
                    {overdue(fu.scheduledFor) && fu.status === "PENDING"
                      ? "overdue"
                      : "due " + timeAgo(fu.scheduledFor)}
                  </p>
                  {fu.note ? (
                    <p className="mt-1 text-sm text-slate-600">{fu.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className={priorityColors[fu.priority] || ""}>
                    {fu.priority}
                  </Badge>
                  <Badge variant={fu.status === "PENDING" ? "default" : "secondary"}>
                    {fu.status}
                  </Badge>
                  {fu.status === "PENDING" ? (
                    <Button size="sm" onClick={() => complete(fu.id)}>
                      Complete
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Follow-up</DialogTitle>
            <DialogDescription>
              Schedule a follow-up call or reminder for a lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fu-lead">Lead</Label>
              <Select
                id="fu-lead"
                value={form.leadId}
                onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name || "Unnamed"}
                    {lead.phone ? ` (${lead.phone})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="fu-date">Scheduled For</Label>
              <Input
                id="fu-date"
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduledFor: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="fu-priority">Priority</Label>
              <Select
                id="fu-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value }))
                }
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="fu-note">Note</Label>
              <Textarea
                id="fu-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="What to discuss..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={createFollowUp} disabled={submitting}>
              {submitting ? "Creating..." : "Create Follow-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}