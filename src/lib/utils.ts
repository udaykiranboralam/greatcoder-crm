import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getTemperatureColor(temp: string): string {
  switch (temp) {
    case "HOT":
      return "bg-red-100 text-red-800 border-red-200";
    case "WARM":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COLD":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    CONTACTED: "bg-yellow-100 text-yellow-800",
    INTERESTED: "bg-green-100 text-green-800",
    DEMO_SCHEDULED: "bg-purple-100 text-purple-800",
    FOLLOW_UP: "bg-orange-100 text-orange-800",
    CONVERTED: "bg-emerald-100 text-emerald-800",
    NOT_INTERESTED: "bg-gray-100 text-gray-800",
    INVALID: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "text-red-600";
  if (score >= 45) return "text-orange-600";
  return "text-blue-600";
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function maskPhone(phone: string | null): string {
  if (!phone) return "N/A";
  if (phone.length <= 4) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-3);
}
