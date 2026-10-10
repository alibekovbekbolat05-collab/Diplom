"use client";

import { forwardRef, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "glow-btn text-ink",
  ghost: "bg-transparent hover:bg-line/30 border border-transparent",
  outline: "border border-line bg-surface/40 hover:border-accent/60 hover:bg-accent/5",
  danger: "border border-critical/50 bg-critical/10 hover:bg-critical/20 text-critical",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "outline", size = "md", magnetic, className, children, ...props },
  ref
) {
  const innerRef = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent) {
    if (!magnetic || reduced || !innerRef.current) return;
    const r = innerRef.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    innerRef.current.style.transform = `translate(${dx * 0.12}px, ${dy * 0.18}px)`;
  }
  function onLeave() {
    if (innerRef.current) innerRef.current.style.transform = "";
  }

  return (
    <motion.button
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
});
