const buckets=new Map<string,{count:number;until:number}>();
export function rateLimit(key:string,limit:number,windowMs:number,now=Date.now()){const current=buckets.get(key);if(!current||current.until<=now){if(buckets.size>=10000){for(const [k,b]of buckets)if(b.until<=now)buckets.delete(k);if(buckets.size>=10000)return false;}buckets.set(key,{count:1,until:now+windowMs});return true;}if(current.count>=limit)return false;current.count++;return true;}
export function clientIp(request:Request){return (request.headers.get("x-forwarded-for")?.split(",")[0]||"local").trim().slice(0,100);}
