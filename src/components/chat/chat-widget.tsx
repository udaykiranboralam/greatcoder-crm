"use client";

import * as React from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatWidgetProps {
  leadId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  title?: string;
  subtitle?: string;
  phone?: string;
  initialMessages?: ChatMessage[];
  endpoint?: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Priya, your AI Career Counselor at GreatCoder Trainings. Ask me about courses, demo classes, fees, or career guidance!",
  timestamp: Date.now(),
};

export function ChatWidget({
  leadId,
  open: controlledOpen,
  onOpenChange,
  className,
  title = "Priya",
  subtitle = "AI Career Counselor",
  phone = "9959011934",
  initialMessages,
  endpoint = "/api/chat",
}: ChatWidgetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    initialMessages?.length ? initialMessages : [WELCOME_MESSAGE]
  );
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const isOpen =
    controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const sendMessage = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, leadId: leadId ?? undefined }),
        });
        const data = await res.json();
        const reply = data?.reply ?? "I'll get back to you on that shortly!";
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: reply,
            timestamp: Date.now(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              "Sorry, I'm having trouble connecting right now. Please try again or call us at +91 " +
              phone,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, endpoint, leadId, phone]
  );

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    "Hi! I'm interested in GreatCoder Trainings courses."
  )}`;

  return (
    <div className={cn("fixed bottom-5 right-5 z-[90]", className)}>
      {isOpen && (
        <div className="mb-3 flex h-[520px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#0F172A] px-4 py-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#DC2626]">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {title}
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  · {subtitle}
                </span>
              </p>
              <p className="text-xs text-emerald-400">Online · replies instantly</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
          >
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-xs font-bold text-white">
                  P
                </div>
                <div className="flex items-center gap-1 rounded-lg rounded-tl-sm border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-white p-3">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={loading}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>GreatCoder Trainings</span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <a
                href={`tel:+91${phone}`}
                className="font-medium text-[#DC2626] hover:text-red-700"
              >
                +91 {phone}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          isOpen ? "bg-slate-900 text-white" : "bg-[#DC2626] text-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <Send className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}

export default ChatWidget;