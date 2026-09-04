"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquareText,
  ChevronDown,
  Mail,
  PhoneCall,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, timeAgo } from "@/lib/utils";

const channelIcons: Record<string, typeof Mail> = {
  chatbot: MessageSquareText,
  meta: MessageSquareText,
  whatsapp: PhoneCall,
  email: Mail,
  website: MessageSquareText,
  other: MessageSquareText,
};

const sentimentColor: Record<string, string> = {
  POSITIVE: "bg-emerald-100 text-emerald-800",
  NEUTRAL: "bg-gray-100 text-gray-700",
  NEGATIVE: "bg-red-100 text-red-700",
};

interface ConversationRow {
  id: string;
  channel: string;
  status: string;
  sentiment: string;
  language: string | null;
  lastMessageAt: string;
  messageCount?: number;
  messages?: Array<{ id: string }>;
  _count?: { messages?: number };
  lead: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationRow[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/conversations");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to load conversations");
          return;
        }
        setConversations(json.data);
      } catch {
        setError("Failed to load conversations");
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {!conversations ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No conversations yet. Conversations start when leads chat with the
            AI counselor on the site.
          </CardContent>
        </Card>
      ) : (
        conversations.map((conv) => {
          const Icon = channelIcons[conv.channel] || MessageSquareText;
          return (
            <Card key={conv.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {conv.lead?.name || "Unknown lead"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {conv.lead?.phone || conv.lead?.email || "No contact"} ·{" "}
                      {conv.channel} ·{" "}
                      {conv._count?.messages ?? conv.messageCount ?? 0} messages
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    className={
                      sentimentColor[conv.sentiment] ||
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {conv.sentiment}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                  {conv.lead ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                        Actions
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/admin/leads/${conv.lead.id}`}>
                            View Lead
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}