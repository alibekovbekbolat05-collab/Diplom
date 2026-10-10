import type { SecurityEvent } from "@/server/schema";
import { detectBuiltins } from "./detectors";
import { evaluateRule,builtInRules,type Rule } from "@/server/rules";
import { classify } from "@/server/ml/inference";
import { behavior } from "@/server/ml/ueba";
import { triage } from "@/server/ml/triage";
import { makeAlert } from "./helpers";
export function detect(events:SecurityEvent[],rules:Rule[]=builtInRules){const alerts=[...detectBuiltins(events),...rules.flatMap(r=>evaluateRule(r,events))];const classifications=new Map(events.map(e=>[e.id,classify(e)]));const baselines=behavior(events);for(const b of baselines)if(b.score>=90&&b.suspicious)alerts.push(makeAlert("ueba_anomaly","medium","T1078",[b.suspicious],{robust_anomaly:b.score,ewma_bytes:b.ewma,samples:b.samples},.65));
for(const e of events){const ml=classifications.get(e.id);if(process.env.ML_FLOW_ALERTS==="1"&&ml&&ml.probability>=.98)alerts.push(makeAlert("ml_flow","medium","T1071",[e],{model_probability:ml.probability,benchmark:"synthetic",feature_contributions:ml.contributions,limitations:ml.explanation},ml.probability));}
return [...new Map(alerts.map(a=>[a.id,a])).values()].map(a=>triage(a,Math.max(0,...a.event_ids.map(id=>classifications.get(id)?.probability||0)),Math.max(0,...baselines.filter(b=>a.entities.includes(b.entity)).map(b=>b.score)),a.entities.some(x=>x.startsWith("srv-"))?75:25)).sort((a,b)=>b.priority-a.priority||b.ts-a.ts);}
