import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { eventSchema,type SecurityEvent } from "@/server/schema";
import { ApiError } from "@/server/http";
function timestamp(x:unknown,now:number) { if(typeof x==="number")return x<100000000000?Math.round(x*1000):Math.round(x);if(typeof x==="string"){if(/^\d+(\.\d+)?$/.test(x))return timestamp(Number(x),now);const d=Date.parse(x);if(Number.isFinite(d))return d;}return now; }
function number(x:unknown){if(x===undefined||x==="-")return 0;const n=Number(x);return Number.isFinite(n)&&n>=0?n:0;}
function ip(x:unknown){return typeof x==="string"&&isIP(x)?x:undefined;}
const actions:Record<number,[string,string,string]>={4624:["authentication","login","success"],4625:["authentication","login","failure"],4672:["iam","special_privileges","success"],4720:["iam","account_created","success"],4728:["iam","group_change","success"],4768:["authentication","kerberos_ticket","success"],4769:["authentication","kerberos_service","success"],4776:["authentication","credential_validation","unknown"]};
export function normalize(input:unknown,source="api",now=Date.now()):SecurityEvent {
 if(!input||typeof input!=="object"||Array.isArray(input))throw new ApiError(422,"invalid_event");const x=input as Record<string,unknown>;
 const win=(x.EventData||x.event_data||{}) as Record<string,unknown>;const eventId=Number(x.EventID||x.event_id);const action=actions[eventId];
 const ts=timestamp(x.ts??x.timestamp??x.TimeCreated??x["Timestamp"]??x["StartTime"],now);
 const raw=JSON.stringify(input).slice(0,4096);const id=createHash("sha256").update(JSON.stringify([source,ts,raw])).digest("hex").slice(0,32);
 const parsed=eventSchema.safeParse({version:1,id,ts,source,host:String(x.host||x.Computer||x["Source IP"]||"unknown").slice(0,1024),event_category:action?.[0]||x.event_category||"network",event_action:action?.[1]||x.event_action||"connection",outcome:action?.[2]||x.outcome||"unknown",
 src_ip:ip(x.src_ip||x["id.orig_h"]||x["Source IP"]||win.IpAddress),dst_ip:ip(x.dst_ip||x["id.resp_h"]||x["Destination IP"]),src_port:x.src_port===undefined&&x["Source Port"]===undefined&&x["id.orig_p"]===undefined?undefined:number(x.src_port??x["Source Port"]??x["id.orig_p"]),dst_port:x.dst_port===undefined&&x["Destination Port"]===undefined&&x["id.resp_p"]===undefined?undefined:number(x.dst_port??x["Destination Port"]??x["id.resp_p"]),
 proto:x.proto||({6:"tcp",17:"udp",1:"icmp"}[number(x.Protocol)]),bytes_in:number(x.bytes_in??x.resp_bytes??x["Total Length of Bwd Packets"]),bytes_out:number(x.bytes_out??x.orig_bytes??x["Total Length of Fwd Packets"]),packets:number(x.packets??x["Total Fwd Packets"])+number(x["Total Backward Packets"]),duration_ms:x.duration_ms!==undefined?number(x.duration_ms):x["Flow Duration"]!==undefined?number(x["Flow Duration"])/1000:number(x.duration)*1000,
 user:x.user||win.TargetUserName||undefined,process:x.process||win.ProcessName||undefined,country:x.country||undefined,http:x.http||undefined,dns:x.dns||undefined,severity_hint:x.severity_hint||undefined,raw_ref:raw,simulation:false});
 if(!parsed.success)throw new ApiError(422,"invalid_event");return parsed.data;
}
export function parseCsv(text:string,delimiter=","):string[][]{const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(!quoted&&c===delimiter){row.push(cell);cell="";}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=c;if(cell.length>16384||row.length>100)throw new ApiError(422,"invalid_csv");if(rows.length>5001)throw new ApiError(413,"too_many_rows");}if(quoted)throw new ApiError(422,"invalid_csv");if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function parseLine(line:string,source:string,now:number){
 if(line.startsWith("{"))return normalize(JSON.parse(line),source,now);
 const web=line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (.*?) HTTP\/[^" ]+" (\d{3}) (\d+|-)(?: "[^"]*" "([^"]*)")?/);
 if(web){const date=web[2].replace(/^(\d+)\/(\w+)\/(\d+):(.*)$/,"$1 $2 $3 $4");return normalize({ts:date,host:"web",event_category:"web",event_action:"http_request",src_ip:web[1],outcome:Number(web[5])<400?"success":"failure",bytes_out:Number(web[6])||0,http:{method:web[3],path:web[4],status:Number(web[5]),user_agent:web[7]||""}},source,now);}
 const sys=line.match(/^<\d+>1 (\S+) (\S+) (\S+) \S+ \S+ (?:-|\[[^\]]*\]) (.*)$/);
 const legacy=line.match(/^(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}) (\S+) ([^:]+): (.*)$/);
 const message=sys?.[4]||legacy?.[4];if(message){const failed=/Failed password|authentication failure/i.test(message);const success=/Accepted password|Accepted publickey/i.test(message);const address=message.match(/(?:from|rhost=)\s*(\S+)/)?.[1];const user=message.match(/(?:for (?:invalid user )?|user=)([\w.@-]+)/)?.[1];return normalize({ts:sys?.[1]||`${new Date(now).getUTCFullYear()} ${legacy?.[1]} UTC`,host:sys?.[2]||legacy?.[2],event_category:failed||success?"authentication":"process",event_action:failed||success?"login":"syslog",outcome:failed?"failure":success?"success":"unknown",src_ip:address,user,process:sys?.[3]||legacy?.[3]},source,now);}
 throw new ApiError(422,"unsupported_log_line");
}
export function parseLogs(text:string,source="file",now=Date.now()):SecurityEvent[]{
 const trimmed=text.trim();if(!trimmed)throw new ApiError(422,"empty_input");if(Buffer.byteLength(text)>2*1024*1024)throw new ApiError(413,"body_too_large");let values:SecurityEvent[];
 try{
 if(trimmed.startsWith("[")){const rows=JSON.parse(trimmed);if(!Array.isArray(rows))throw new ApiError(422,"invalid_batch");if(rows.length>5000)throw new ApiError(413,"too_many_rows");values=rows.map(x=>normalize(x,source,now));}
 else if(trimmed.startsWith("{")&&!trimmed.includes("\n")){const x=JSON.parse(trimmed);values=[normalize(x,source,now)];}
 else if(trimmed.startsWith("#")&&trimmed.includes("#fields")){const lines=trimmed.split(/\r?\n/);const fields=lines.find(l=>l.startsWith("#fields"))!.split("\t").slice(1);const rows=lines.filter(l=>!l.startsWith("#"));if(rows.length>5000)throw new ApiError(413,"too_many_rows");values=rows.map(l=>normalize(Object.fromEntries(l.split("\t").map((v,i)=>[fields[i],v])),source,now));}
 else if(/^("?Source IP"?|Flow ID|ts,|timestamp,|id,)/i.test(trimmed)){const rows=parseCsv(trimmed),fields=rows.shift()!;if(rows.length>5000)throw new ApiError(413,"too_many_rows");values=rows.map(row=>{if(row.length!==fields.length)throw new ApiError(422,"invalid_csv_columns");return normalize(Object.fromEntries(row.map((v,i)=>[fields[i].trim(),v])),source,now);});}
 else if(trimmed.startsWith("{") ){try{values=[normalize(JSON.parse(trimmed),source,now)];}catch{const lines=trimmed.split(/\r?\n/).filter(Boolean);if(lines.length>5000)throw new ApiError(413,"too_many_rows");values=lines.map(l=>parseLine(l,source,now));}}
 else{const lines=trimmed.split(/\r?\n/).filter(Boolean);if(lines.length>5000)throw new ApiError(413,"too_many_rows");values=lines.map(l=>parseLine(l,source,now));}
 }catch(e){if(e instanceof ApiError)throw e;throw new ApiError(422,"parse_failed");}
 if(!values.length||values.length>5000)throw new ApiError(413,"invalid_batch_size");return values;
}
