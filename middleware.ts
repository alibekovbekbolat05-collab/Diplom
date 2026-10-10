import { NextRequest, NextResponse } from "next/server";
import { site } from "@/config/site";
import { getSessionFromRequest } from "@/server/auth/session";

const PUBLIC_FILE = /\.(.*)$/;

function detectLocale(req: NextRequest): string {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && site.locales.includes(cookie as never)) return cookie;
  const header = req.headers.get("accept-language") || "";
  for (const part of header.split(",")) {
    const code = part.trim().split(";")[0].slice(0, 2).toLowerCase();
    if ((site.locales as readonly string[]).includes(code)) return code;
  }
  return site.defaultLocale;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/apple-icon" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  const isPlatform =
    maybeLocale &&
    (site.locales as readonly string[]).includes(maybeLocale) &&
    segments[1] === "platform";
  if (isPlatform && segments[2] !== "login") {
    const session = await getSessionFromRequest(req);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = `/${maybeLocale}/platform/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (
    !maybeLocale ||
    !(site.locales as readonly string[]).includes(maybeLocale)
  ) {
    const locale = detectLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
