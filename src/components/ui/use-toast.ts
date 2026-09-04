"use client";

import { useToastContext, type Toast, type ToastOptions } from "@/components/ui/toast";

export function useToast(): {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
} {
  const { toast, dismiss } = useToastContext();
  return { toast, dismiss };
}

export type { Toast, ToastOptions };