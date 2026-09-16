"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { CODE_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CodeEntry() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const code = digits.join("");

  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      setDigits((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setDigits(next);
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function submit(fullCode = code) {
    if (fullCode.length !== CODE_LENGTH) {
      toast.error("נא להזין קוד חתונה בן 6 ספרות.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "הקוד אינו תקין.");
      toast.success("ברוכים הבאים. נמשיך יחד ברוגע.");
      router.replace(payload.hasEvent ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "הקוד אינו תקין.");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="w-full max-w-xl text-center"
    >
      <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-3xl bg-gold/15 text-gold-dark">
        <Heart className="size-7 fill-current" />
      </div>
      <p className="text-sm tracking-[0.2em] text-gold-dark">סנדרין</p>
      <h1 className="mt-3 text-4xl font-semibold md:text-5xl">הזינו את קוד החתונה</h1>
      <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
        הקוד שקיבלתם מאולם סנדרין יפתח את האירוע שלכם. אחר כך נכיר את השמות,
        התאריך והמוזמנים — ברוגע ובקלות.
      </p>

      <form
        className="mt-10"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div dir="ltr" className="flex items-end justify-center gap-2 sm:gap-4">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`ספרה ${index + 1} מתוך ${CODE_LENGTH}`}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={onPaste}
              onFocus={(event) => event.target.select()}
              className={cn(
                "h-20 w-11 bg-transparent text-center text-4xl font-medium text-foreground outline-none transition-all sm:h-24 sm:w-14 sm:text-5xl",
                "border-0 border-b-[3px] border-gold/35 caret-gold",
                "focus:border-gold focus:drop-shadow-[0_8px_18px_rgba(196,165,116,0.28)]",
                digit ? "border-gold-dark" : "border-gold/30",
              )}
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="mt-10 min-w-52"
          disabled={loading || code.length !== CODE_LENGTH}
        >
          {loading ? "בודקים את הקוד..." : "כניסה לאירוע"}
        </Button>
      </form>
    </motion.div>
  );
}
