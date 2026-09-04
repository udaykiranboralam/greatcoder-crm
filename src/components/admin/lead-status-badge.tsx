"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border", getStatusColor(status))}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}