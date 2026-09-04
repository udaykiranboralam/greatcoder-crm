"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-xs font-bold text-white">
          P
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-tr-sm bg-[#DC2626] text-white"
            : "rounded-tl-sm border border-slate-200 bg-white text-slate-900",
          "whitespace-pre-wrap break-words"
        )}
      >
        <p>{message.content}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isUser ? "text-red-100" : "text-slate-400"
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default ChatMessage;