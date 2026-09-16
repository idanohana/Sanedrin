"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        dir="rtl"
        position="top-center"
        richColors
        toastOptions={{
          className: "font-sans text-right",
        }}
      />
    </>
  );
}
