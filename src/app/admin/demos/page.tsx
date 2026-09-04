"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  NO_SHOW: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

interface DemoRow {
  id: string;
  scheduledAt: string;
  mode: string;
  status: string;
  notes: string | null;
  lead: { id: string; name: string | null; phone: string | null };
  course: { id: string; name: string } | null;
}

interface LeadOption {
  id: string;
  name: string | null;
  phone: string | null;
}

interface CourseOption {
  id: string;
  name: string;
}

export default function DemosPage() {
  const { toast } = useToast();
  const [demos, setDemos] = useState<DemoRow[] | null>(null);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    leadId: "",
    courseId: "",
    scheduledAt: "",
    mode: "OFFLINE",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [demosRes, leadsRes, coursesRes] = await Promise.all([
          fetch("/api/demos"),
          fetch("/api/leads"),
          fetch("/api/courses"),
        ]);
        const demosJson = await demosRes.json();
        const leadsJson = await leadsRes.json();
        const coursesJson = await coursesRes.json();
        if (!demosRes.ok) {
          setError(demosJson.error || "Failed to load demos");
          return;
        }
        setDemos(demosJson.data);
        if (leadsRes.ok) setLeads(leadsJson.data);
        if (coursesRes.ok) setCourses(coursesJson.data);
      } catch {
        setError("Failed to load demos");
      }
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/demos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast({ title: "Failed to update demo", variant: "destructive" });
      return;
    }
    setDemos((prev) =>
      prev ? prev.map((d) => (d.id === id ? { ...d, status } : d)) : prev
    );
    toast({ title: "Demo updated" });
  };

  const createDemo = async () => {
    if (!form.leadId || !form.scheduledAt) {
      toast({
        title: "Lead and scheduled date are required",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/demos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: form.leadId,
        courseId: form.courseId || undefined,
        scheduledAt: form.scheduledAt,
        mode: form.mode,
        notes: form.notes || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Failed to create demo", variant: "destructive" });
      return;
    }
    const json = await res.json();
    setDemos((prev) => (prev ? [json.data, ...prev] : prev));
    setDialogOpen(false);
    setForm({ leadId: "", courseId: "", scheduledAt: "", mode: "OFFLINE", notes: "" });
    toast({ title: "Demo scheduled" });
  };

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Demo
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {!demos ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-slate-500"
                    >
                      No demos scheduled yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  demos.map((demo) => (
                    <TableRow key={demo.id}>
                      <TableCell className="font-medium text-slate-900">
                        {demo.lead?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {demo.course?.name || "—"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDateTime(demo.scheduledAt)}
                      </TableCell>
                      <TableCell>{demo.mode}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[demo.status] || ""}>
                          {demo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate text-slate-500">
                        {demo.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                            Update
                            <ChevronDown className="ml-1 h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => updateStatus(demo.id, "COMPLETED")}
                            >
                              Mark Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(demo.id, "NO_SHOW")}
                            >
                              Mark No Show
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(demo.id, "RESCHEDULED")}
                            >
                              Mark Rescheduled
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateStatus(demo.id, "CANCELLED")}
                            >
                              Cancel Demo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Demo</DialogTitle>
            <DialogDescription>
              Book a free demo class for a lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="demo-lead">Lead</Label>
              <Select
                id="demo-lead"
                value={form.leadId}
                onChange={(e) => set("leadId")(e.target.value)}
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
              <Label htmlFor="demo-course">Course (optional)</Label>
              <Select
                id="demo-course"
                value={form.courseId}
                onChange={(e) => set("courseId")(e.target.value)}
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="demo-date">Scheduled Date &amp; Time</Label>
              <Input
                id="demo-date"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => set("scheduledAt")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="demo-mode">Mode</Label>
              <Select
                id="demo-mode"
                value={form.mode}
                onChange={(e) => set("mode")(e.target.value)}
              >
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="demo-notes">Notes</Label>
              <Textarea
                id="demo-notes"
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="Optional notes for the demo..."
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
            <Button onClick={createDemo} disabled={submitting}>
              {submitting ? "Scheduling..." : "Schedule Demo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}