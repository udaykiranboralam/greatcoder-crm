"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  description: string | null;
  duration: string | null;
  price: number | string | null;
  mode: string;
  level: string | null;
  isActive: boolean;
  featured: boolean;
  image: string | null;
  icon: string | null;
  sortOrder: number;
}

const emptyForm = {
  name: "",
  slug: "",
  shortDesc: "",
  description: "",
  duration: "",
  price: "",
  mode: "OFFLINE",
  level: "",
  isActive: true,
  featured: false,
};

type CourseForm = typeof emptyForm;

export default function CoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/courses");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load courses");
          return;
        }
        setCourses(json.data);
      } catch {
        setError("Failed to load courses");
      }
    };
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      name: course.name,
      slug: course.slug,
      shortDesc: course.shortDesc || "",
      description: course.description || "",
      duration: course.duration || "",
      price: course.price !== null && course.price !== undefined ? String(course.price) : "",
      mode: course.mode,
      level: course.level || "",
      isActive: course.isActive,
      featured: course.featured,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) {
      toast({ title: "Course name is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const url = editing ? `/api/courses/${editing.id}` : "/api/courses";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast({
        title: json?.error || "Failed to save course",
        variant: "destructive",
      });
      return;
    }
    const json = await res.json();
    setDialogOpen(false);
    if (editing) {
      setCourses((prev) =>
        prev ? prev.map((c) => (c.id === editing.id ? json.data : c)) : prev
      );
      toast({ title: "Course updated" });
    } else {
      setCourses((prev) => (prev ? [...prev, json.data] : prev));
      toast({ title: "Course created" });
    }
  };

  const set = (key: keyof CourseForm) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {!courses ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-slate-500"
                    >
                      No courses yet. Create your first course.
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium text-slate-900">
                        {course.name}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {course.slug}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {course.duration || "—"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {course.mode}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {course.price !== null ? `₹${course.price}` : "—"}
                      </TableCell>
                      <TableCell>
                        {course.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.featured ? (
                          <Badge variant="default">Featured</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(course)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Course" : "Create Course"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Update details for ${editing.name}.`
                : "Add a new course to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="course-name">Name</Label>
              <Input
                id="course-name"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="course-slug">Slug (leave empty to auto-generate)</Label>
              <Input
                id="course-slug"
                value={form.slug}
                onChange={(e) => set("slug")(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="course-short">Short Description</Label>
              <Input
                id="course-short"
                value={form.shortDesc}
                onChange={(e) => set("shortDesc")(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="course-desc">Description</Label>
              <Textarea
                id="course-desc"
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="course-duration">Duration</Label>
              <Input
                id="course-duration"
                placeholder="e.g. 4 months"
                value={form.duration}
                onChange={(e) => set("duration")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="course-price">Price (₹)</Label>
              <Input
                id="course-price"
                type="number"
                value={form.price}
                onChange={(e) => set("price")(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="course-mode">Mode</Label>
              <Select
                id="course-mode"
                value={form.mode}
                onChange={(e) => set("mode")(e.target.value)}
              >
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="course-level">Level</Label>
              <Input
                id="course-level"
                placeholder="e.g. Beginner"
                value={form.level}
                onChange={(e) => set("level")(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(c) => set("isActive")(c)}
                  id="course-active"
                />
                <Label htmlFor="course-active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(c) => set("featured")(c)}
                  id="course-featured"
                />
                <Label htmlFor="course-featured">Featured</Label>
              </div>
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
            <Button onClick={save} disabled={submitting}>
              {submitting ? "Saving..." : editing ? "Save Changes" : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}