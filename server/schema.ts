import { z } from "zod";
const text=z.string().max(1024);
export const severitySchema=z.enum(["info","low","medium","high","critical"]);
export const eventSchema=z.object({
 version:z.literal(1).default(1),id:z.string().min(1).max(128),ts:z.number().int().min(0).max(8640000000000000),source:text,host:text.min(1),
 event_category:z.enum(["authentication","network","dns","web","process","file","iam","mail"]),event_action:text,outcome:z.enum(["success","failure","unknown"]).default("unknown"),
 src_ip:z.string().ip().optional(),dst_ip:z.string().ip().optional(),src_port:z.number().int().min(0).max(65535).optional(),dst_port:z.number().int().min(0).max(65535).optional(),proto:z.enum(["tcp","udp","icmp","other"]).optional(),
 bytes_in:z.number().finite().nonnegative().default(0),bytes_out:z.number().finite().nonnegative().default(0),packets:z.number().finite().nonnegative().default(0),duration_ms:z.number().finite().nonnegative().default(0),
 user:text.optional(),process:text.optional(),country:z.string().regex(/^[A-Z]{2}$/).optional(),
 http:z.object({method:z.string().max(16),path:z.string().max(4096),status:z.number().int().min(100).max(599),user_agent:text}).optional(),
 dns:z.object({query:text,qtype:z.string().max(16)}).optional(),severity_hint:severitySchema.optional(),raw_ref:z.string().max(4096).optional(),simulation:z.boolean().default(false),
}).strict();
export type SecurityEvent=z.infer<typeof eventSchema>;
export type Severity=z.infer<typeof severitySchema>;
export interface AuditEntry { id:string;ts:number;email:string;action:string;ip:string; }
export interface Alert { id:string;type:string;severity:Severity;confidence:number;ts:number;entities:string[];event_ids:string[];mitre:string;recommendation:string;evidence:Record<string,unknown>;simulation:boolean;priority:number;factors:{name:string;value:number}[]; }
export interface Incident { id:string;title:string;entity:string;severity:Severity;first_seen:number;last_seen:number;alert_ids:string[];status:"open"|"investigating"|"resolved"|"false_positive";assignee:string;comments:{ts:number;email:string;text:string}[];notes:string;simulation:boolean; }
