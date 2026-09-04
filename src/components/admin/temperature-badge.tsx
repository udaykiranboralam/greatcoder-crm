"use client";

import { Badge } from "@/components/ui/badge";
import { getTemperatureColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TemperatureBadge({
  temperature,
}: {
  temperature: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border", getTemperatureColor(temperature))}
    >
      {temperature}
    </Badge>
  );
}