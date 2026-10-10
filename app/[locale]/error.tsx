"use client";
import { useI18n } from "@/components/providers";
export default function ErrorPage({reset}:{reset:()=>void}) { const {messages:m}=useI18n();return <main className="mx-auto max-w-xl px-5 py-32"><h1 className="font-display text-3xl">{m.p500.title}</h1><p className="my-6 text-mute">{m.p500.text}</p><button onClick={reset} className="glow-btn rounded-xl px-6 py-3">{m.common.resume}</button></main>; }
