"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  MessageSquareText,
  CalendarClock,
  BellRing,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/leads/pipeline", label: "Lead Pipeline", icon: KanbanSquare },
  { href: "/admin/conversations", label: "Conversations", icon: MessageSquareText },
  { href: "/admin/demos", label: "Demos", icon: CalendarClock },
  { href: "/admin/follow-ups", label: "Follow-ups", icon: BellRing },
];

const adminOnlyNavItems = [
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/leads": "Leads",
  "/admin/leads/pipeline": "Lead Pipeline",
  "/admin/conversations": "Conversations",
  "/admin/demos": "Demos",
  "/admin/follow-ups": "Follow-ups",
  "/admin/courses": "Courses",
  "/admin/analytics": "Analytics",
  "/admin/team": "Team",
  "/admin/settings": "Settings",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const matchingTitle = Object.entries(pageTitles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([base]) => pathname === base || pathname.startsWith(base + "/"));

  const title = matchingTitle?.[1] || "Admin";

  const allItems = [...navItems, ...(isAdmin ? adminOnlyNavItems : [])];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900">
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#DC2626]">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">GreatCoder Admin</p>
            <p className="text-xs text-slate-400">Admissions CRM</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {allItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white",
                  active && "bg-slate-800 text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 text-slate-400 group-hover:text-white",
                    active && "text-[#DC2626]"
                  )}
                />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <ExternalLink className="h-5 w-5 shrink-0 text-slate-400" />
            View Site
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session?.user?.name || ""} />
                ) : null}
                <AvatarFallback>
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {session?.user?.name || "Admin"}
                </p>
                <p className="text-xs text-slate-500">
                  {session?.user?.role === "ADMIN" ? "Administrator" : "Counselor"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}