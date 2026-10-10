import type { SecurityEvent } from "@/server/schema";
import { detectBuiltins } from "./detectors";
import { evaluateRule,builtInRules,type Rule } from "@/server/rules";
export function detect(events:SecurityEvent[],rules:Rule[]=builtInRules){const alerts=[...detectBuiltins(events),...rules.flatMap(r=>evaluateRule(r,events))];return [...new Map(alerts.map(a=>[a.id,a])).values()].sort((a,b)=>b.priority-a.priority||b.ts-a.ts);}
