import { generateWindow,SIM_SEED } from "@/server/simulator";
import { eventSchema,type SecurityEvent } from "@/server/schema";
import { readStore } from "@/server/adapters/store";
import type { Session } from "@/server/auth/session";
export function simulationEvents(now=Date.now()):SecurityEvent[]{return generateWindow(SIM_SEED,now-15*60000,now,5000).map(e=>eventSchema.parse(Object.fromEntries(Object.entries({...e,simulation:true}).filter(([k])=>k!=="sim_scenario"&&k!=="sim"))));}
export async function selectedEvents(session:Session,source:string){if(session.demo||source!=="ingested")return simulationEvents();return (await readStore()).events;}
