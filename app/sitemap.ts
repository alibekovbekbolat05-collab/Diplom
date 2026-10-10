import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function sitemap():MetadataRoute.Sitemap{const routes=["","/product","/services","/method","/about","/contact","/privacy","/api-docs"];return routes.flatMap(route=>site.locales.map(locale=>({url:`${site.url}/${locale}${route}`,changeFrequency:"monthly" as const,priority:route?0.7:1,alternates:{languages:Object.fromEntries([...site.locales.map(l=>[l,`${site.url}/${l}${route}`]),["x-default",`${site.url}/ru${route}`]])}})));}
