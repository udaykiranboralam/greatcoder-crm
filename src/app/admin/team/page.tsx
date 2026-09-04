"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "COUNSELOR",
  isActive: true,
};

export default function TeamPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load team members");
          return;
        }
        setMembers(json.data);
      } catch {
        setError("Failed to load team members");
      }
    };
    load();
  }, []);

  const addMember = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({
        title: "Name, email and password are required",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast({ title: json?.error || "Failed to add member", variant: "destructive" });
      return;
    }
    const json = await res.json();
    setMembers((prev) => (prev ? [...prev, json.data] : prev));
    setDialogOpen(false);
    setForm(emptyForm);
    toast({ title: "Team member added" });
  };

  const updateMember = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast({ title: "Failed to update member", variant: "destructive" });
      return;
    }
    const json = await res.json();
    setMembers((prev) =>
      prev ? prev.map((m) => (m.id === id ? { ...m, ...json.data } : m)) : prev
    );
    toast({ title: "Team member updated" });
  };

  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {!members ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-slate-900">
                      {member.name}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        aria-label="Role"
                        value={member.role}
                        onChange={(e) =>
                          updateMember(member.id, { role: e.target.value })
                        }
                        className="h-8 w-36"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="COUNSELOR">Counselor</option>
                      </Select>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(member.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={member.isActive}
                        onCheckedChange={(checked) =>
                          updateMember(member.id, { isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={member.isActive ? "success" : "secondary"}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a login for a counselor or administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="member-password">Password</Label>
              <Input
                id="member-password"
                type="password"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="member-role">Role</Label>
              <Select
                id="member-role"
                value={form.role}
                onChange={(e) => set("role")(e.target.value)}
              >
                <option value="COUNSELOR">Counselor</option>
                <option value="ADMIN">Admin</option>
              </Select>
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
            <Button onClick={addMember} disabled={submitting}>
              {submitting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}