"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement | null>(null);
  const ring = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (document.body.dataset.cursor) return;
    document.body.dataset.cursor = "custom";

    let x = -100,
      y = -100,
      rx = -100,
      ry = -100,
      raf = 0;
    let hovering = false;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = e.target as HTMLElement | null;
      hovering = !!target?.closest(
        "a,button,[role=button],input,textarea,select,label",
      );
    };
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dot.current)
        dot.current.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
      if (ring.current) {
        ring.current.style.transform = `translate(${rx - 16}px, ${ry - 16}px) scale(${hovering ? 1.5 : 1})`;
        ring.current.style.opacity = hovering ? "0.9" : "0.5";
      }
      raf = requestAnimationFrame(loop);
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      delete document.body.dataset.cursor;
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] hidden [@media(pointer:fine)]:block"
    >
      <div ref={dot} className="absolute h-1.5 w-1.5 rounded-full bg-accent" />
      <div
        ref={ring}
        className="absolute h-8 w-8 rounded-full border border-accent/60"
        style={{ transition: "opacity .2s ease" }}
      />
      <motion.div />
    </div>
  );
}
