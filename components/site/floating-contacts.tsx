"use client";

import { motion } from "framer-motion";
import { company } from "@/config/company";

export function FloatingContacts() {
  const tg = `https://t.me/${company.contacts.telegram}`;
  const wa = `https://wa.me/${company.contacts.whatsapp}`;
  return (
    <div className="no-print fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col gap-2">
      <motion.a
        href={tg}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-surface/80 shadow-lg backdrop-blur"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(var(--c-accent))" aria-hidden>
          <path d="M21.9 4.6 19 19.3c-.2 1-.8 1.2-1.6.8l-4.5-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6L18.7 7c.4-.3-.1-.5-.6-.2L7.7 13.3 3.3 12c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1.6z" />
        </svg>
      </motion.a>
      <motion.a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-accent2/40 bg-surface/80 shadow-lg backdrop-blur"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="rgb(var(--c-accent2))" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5 13.9c-.2.6-1.2 1.1-1.7 1.2-.4 0-1 .1-1.6-.1a13 13 0 0 1-5.8-5.1c-.6-1-.9-2-.9-2.7 0-.7.4-1.4.7-1.7.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.1.2-.3.4-.1.7.2.4.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 .9c.3.2.5.3.6.4 0 .2 0 .7-.2 1.3z" />
        </svg>
      </motion.a>
    </div>
  );
}
