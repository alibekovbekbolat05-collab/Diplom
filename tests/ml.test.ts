import { describe,it,expect } from "vitest";
import { model,probability,features } from "@/server/ml/inference";
import { robustZ } from "@/server/ml/ueba";
import { triage } from "@/server/ml/triage";
import { makeAlert } from "@/server/detection/helpers";
import { normalize } from "@/server/parsers";
import { caseSummary } from "@/server/ml/summary";
const event=normalize({ts:1700000000000,host:"srv",event_category:"network",event_action:"connection",bytes_in:100,bytes_out:100,packets:10,duration_ms:1000});
describe("ML",()=>{it.each(model.parity_fixture.map((x,i)=>({i,...x})))("matches Python fixture $i",row=>expect(probability(row.x)).toBeCloseTo(row.p,6));it("rejects bad feature lengths",()=>expect(()=>probability([1])).toThrow());it("rejects non-finite values",()=>expect(()=>probability(Array(10).fill(Infinity))).toThrow());it("extracts ten flow features",()=>expect(features(event).length).toBe(10));it("has bounded tree count",()=>expect(model.trees.length).toBeLessThanOrEqual(50));it("requires adequate behavior history",()=>expect(robustZ(100000,[1,2])).toBe(0));it("finds volume outliers",()=>expect(robustZ(100000,Array(30).fill(100))).toBeGreaterThan(10));it("prioritization is monotonic",()=>{const a=makeAlert("test","high","T1071",[event],{});expect(triage(a,1,90,90).priority).toBeGreaterThanOrEqual(triage(a,0,0,0).priority);});it("has a deterministic summary fallback",async()=>{const c={id:"1",title:"test",entity:"srv",severity:"high" as const,first_seen:1,last_seen:2,alert_ids:[],status:"open" as const,assignee:"",comments:[],notes:"",simulation:false};expect((await caseSummary(c,[],"ru")).ai_generated).toBe(false);});});
