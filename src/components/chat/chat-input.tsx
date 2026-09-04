"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Course fees?",
  "Demo class",
  "Career guidance",
  "Course duration",
];

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Type your message...",
  disabled = false,
  suggestions = SUGGESTIONS,
  className,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [value]);

  const submit = React.useCallback(
    (text?: string) => {
      onSend(text?.trim() ? text : value);
    },
    [onSend, value]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => submit(sug)}
            disabled={disabled}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] disabled:opacity-50"
          >
            {sug}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "max-h-[120px] min-h-[40px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 disabled:opacity-50"
          )}
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={!canSend}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            canSend
              ? "bg-[#DC2626] text-white hover:bg-red-700"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          )}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default ChatInput;