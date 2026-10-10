import { detect } from "@/server/detection";
import { correlate,assets } from "@/server/correlation";
import { selectedEvents } from "./data";
import { readStore,updateStore } from "@/server/adapters/store";
import { ruleSchema,builtInRules } from "@/server/rules";
import type { Session } from "@/server/auth/session";
import type { SecurityEvent } from "@/server/schema";
export async function snapshot(session:Session,source:string,scenario="scheduled"){const simulation=session.demo||source!=="ingested";const events=await selectedEvents(session,simulation?"simulation":"ingested",scenario);if(simulation){const alerts=detect(events);return {events,alerts,cases:correlate(alerts),assets:assets(events,alerts),simulation:true};}const store=await readStore();return {events,alerts:store.alerts,cases:store.cases,assets:assets(events,store.alerts),simulation:false};}
export async function processEvents(fresh:SecurityEvent[]){return updateStore(data=>{const ids=new Set(data.events.map(e=>e.id));const accepted=fresh.filter(e=>{if(ids.has(e.id))return false;ids.add(e.id);return true;});data.events.push(...accepted);const latest=Math.max(...accepted.map(e=>e.ts),0);const window=data.events.filter(e=>e.ts>=latest-24*3600000&&e.ts<=latest);const rules=data.rules.length?data.rules.map(r=>ruleSchema.parse(r)):builtInRules;const alerts=detect(window,rules);const seen=new Set(data.alerts.map(a=>a.id));const newAlerts=alerts.filter(a=>!seen.has(a.id));data.alerts.push(...newAlerts);data.cases=correlate(newAlerts,data.cases);return {accepted:accepted.length,alerts:newAlerts.length};});}
