"use client";
import { useState } from "react";
import { useI18n } from "@/components/providers";
export function ContactForm() {
  const { messages: m }=useI18n(); const [status,setStatus]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); setBusy(true); setStatus(""); const form=e.currentTarget; const data=Object.fromEntries(new FormData(form));
    try { const res=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});setStatus(res.ok?m.contact.sent:res.status===503?m.contact.unavailable:res.status===429?m.contact.limited:m.contact.error);if(res.ok)form.reset(); } catch { setStatus(m.contact.error); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="panel space-y-5 p-7">{[["name",m.contact.name,"text"],["email",m.contact.email,"email"]].map(([name,label,type])=><label key={name} className="block text-sm">{label}<input required name={name} type={type} maxLength={name==="name"?100:254} autoComplete={name} className="mt-2 w-full rounded-lg border border-line bg-bg px-4 py-3"/></label>)}<label className="block text-sm">{m.contact.message}<textarea name="message" required minLength={10} maxLength={3000} rows={5} className="mt-2 w-full rounded-lg border border-line bg-bg px-4 py-3"/></label><label className="hidden" aria-hidden>Website<input name="website" tabIndex={-1} autoComplete="off"/></label><button disabled={busy} className="glow-btn rounded-xl px-6 py-3 disabled:opacity-50">{busy?m.common.loading:m.contact.send}</button><p role="status" className="text-sm text-accent">{status}</p></form>;
}
