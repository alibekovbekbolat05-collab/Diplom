import { EventList } from "@/components/platform/event-list";
import { pageContext,type PageProps } from "@/lib/metadata";
export default async function Events(p:PageProps){const {m}=await pageContext(p);return <><h1 className="mb-8 font-display text-3xl">{m.platform.events}</h1><EventList/></>;}
