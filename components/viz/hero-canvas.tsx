"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  bad: boolean;
}

interface Arc {
  from: number;
  to: number;
  t: number;
  speed: number;
}

export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0,
      h = 0,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nodes: Node[] = [];
    const arcs: Arc[] = [];
    let raf = 0;
    let running = true;
    let visible = true;
    let t = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      nodes.length = 0;
      const count = Math.min(46, Math.max(24, Math.floor(w / 30)));
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.6,
          bad: Math.random() < 0.08,
        });
      }
    }

    function step() {
      if (!running || !visible || !ctx || !canvas) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            const alpha = (1 - Math.sqrt(d2) / 110) * 0.22;
            ctx.strokeStyle = `rgba(34,211,238,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (t % 90 === 0 && nodes.length > 6) {
        const badIdx = nodes.findIndex((n) => n.bad);
        arcs.push({
          from: badIdx >= 0 ? badIdx : 0,
          to: Math.floor(Math.random() * nodes.length),
          t: 0,
          speed: 0.012 + Math.random() * 0.01,
        });
        if (arcs.length > 5) arcs.shift();
      }
      for (const arc of arcs) {
        arc.t += arc.speed;
        const a = nodes[arc.from],
          b = nodes[arc.to];
        if (!a || !b) continue;
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2 - 40;
        const p = Math.min(arc.t, 1);
        const px = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * mx + p * p * b.x;
        const py = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * my + p * p * b.y;
        const alpha = arc.t > 1 ? Math.max(0, 1.6 - arc.t) : 1;
        ctx.strokeStyle = `rgba(244,63,94,${0.7 * alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, arc.t <= 1 ? px : b.x, arc.t <= 1 ? py : b.y);
        ctx.stroke();
        if (arc.t > 1.6) arc.t = 0;
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.bad
          ? "rgba(244,63,94,0.9)"
          : `rgba(34,211,238,${0.5 + 0.3 * Math.sin(t * 0.03 + n.x)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    seed();
    raf = requestAnimationFrame(step);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      }
    });
    io.observe(canvas);

    const onVis = () => {
      visible = !document.hidden;
      if (visible && running) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(() => {
      resize();
      seed();
    });
    ro.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
