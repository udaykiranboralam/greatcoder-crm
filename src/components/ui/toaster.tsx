"use client";

import * as React from "react";
import {
  Toast,
  ToastProvider,
  ToastViewport,
  useToastContext,
} from "@/components/ui/toast";

function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport>
        <ToastList />
      </ToastViewport>
    </ToastProvider>
  );
}

function ToastList() {
  const { toasts, dismiss } = useToastContext();
  return (
    <>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          open={t.open}
          variant={t.variant}
          title={t.title}
          description={t.description}
          action={t.action}
          onClose={() => dismiss(t.id)}
        />
      ))}
    </>
  );
}

export { Toaster };