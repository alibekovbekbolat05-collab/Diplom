import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/server/auth/session";
import { PlatformShell } from "@/components/platform/shell";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function ConsoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = await cookies();
  const session = await verifySessionToken(c.get(SESSION_COOKIE)?.value || "");
  if (!session) redirect(`/${locale}/platform/login`);
  return <PlatformShell session={session}>{children}</PlatformShell>;
}
