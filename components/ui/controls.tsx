"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  const layoutId = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface/60 p-0.5",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-full transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active ? "text-ink" : "text-mute hover:text-ink"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full border border-accent/40 bg-accent/10"
                transition={springSnappy}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-ink placeholder:text-mute/70 focus:border-accent/60 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-line bg-surface/60 p-3 text-sm text-ink placeholder:text-mute/70 focus:border-accent/60 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-accent/60 focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wide text-mute">{label}</span>
      {children}
    </label>
  );
}
