import { readFile,mkdir,writeFile,rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { SecurityEvent,Alert,Incident,AuditEntry } from "@/server/schema";
export interface StoreData {events:SecurityEvent[];alerts:Alert[];cases:Incident[];audit:AuditEntry[];rules:unknown[];tokens:{id:string;hash:string;label:string;created:number;revoked:boolean}[];settings:{ipMask:boolean};}
const empty=():StoreData=>({events:[],alerts:[],cases:[],audit:[],rules:[],tokens:[],settings:{ipMask:false}});
let memory:StoreData|undefined;let queue:Promise<unknown>=Promise.resolve();
const file="/tmp/secureops/store-v1.json";
function redisEnabled(){return !!process.env.UPSTASH_REDIS_REST_URL&&!!process.env.UPSTASH_REDIS_REST_TOKEN;}
export async function redisCommand(command:(string|number)[]){const url=process.env.UPSTASH_REDIS_REST_URL!;if(!url.startsWith("https://"))throw new Error("Invalid Redis URL");const res=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify(command),signal:AbortSignal.timeout(5000),cache:"no-store"});if(!res.ok)throw new Error("Store unavailable");const value=await res.json();if(value.error)throw new Error("Store unavailable");return value.result;}
async function read():Promise<StoreData>{if(redisEnabled()){const s=await redisCommand(["GET","secureops:data:v1"]);return s?JSON.parse(s):empty();}if(memory)return structuredClone(memory);try{memory=JSON.parse(await readFile(file,"utf8"));}catch{memory=empty();}return structuredClone(memory!);}
export async function readStore(){return read();}
export function updateStore<T>(fn:(data:StoreData)=>T):Promise<T>{const operation=queue.then(async()=>{let lock:string|undefined;if(redisEnabled()){lock=randomUUID();let acquired=false;for(let i=0;i<10;i++){if(await redisCommand(["SET","secureops:lock",lock,"NX","PX",15000])){acquired=true;break;}await new Promise(resolve=>setTimeout(resolve,100));}if(!acquired)throw new Error("Store busy");}
 try{const data=await read();const result=fn(data);data.events=data.events.slice(-20000);data.alerts=data.alerts.slice(-5000);data.cases=data.cases.slice(-2000);data.audit=data.audit.slice(-5000);
 if(lock){const saved=await redisCommand(["EVAL","if redis.call('GET',KEYS[1])==ARGV[1] then redis.call('SET',KEYS[2],ARGV[2]); return 1 else return 0 end",2,"secureops:lock","secureops:data:v1",lock,JSON.stringify(data)]);if(saved!==1)throw new Error("Store lease expired");}
 else{await mkdir("/tmp/secureops",{recursive:true});const temp=`${file}.${randomUUID()}`;await writeFile(temp,JSON.stringify(data),{mode:0o600});await rename(temp,file);memory=data;}return result;
 }finally{if(lock)await redisCommand(["EVAL","if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",1,"secureops:lock",lock]);}});queue=operation.catch(()=>{});return operation;}
export async function audit(email:string,action:string,ip:string){await updateStore(data=>{data.audit.push({id:randomUUID(),ts:Date.now(),email,action,ip});});}
export function storageMode(){return redisEnabled()?"redis":"ephemeral-memory-tmp";}
