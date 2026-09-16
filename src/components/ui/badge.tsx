import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "gold" | "success" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-muted text-foreground",
        variant === "gold" && "bg-gold-light/70 text-gold-dark",
        variant === "success" && "bg-[#e7f0e4] text-success",
        variant === "danger" && "bg-[#f6e6e6] text-danger",
        variant === "muted" && "bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
