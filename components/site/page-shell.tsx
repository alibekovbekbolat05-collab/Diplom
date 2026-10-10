"use client";

import { usePathname } from "next/navigation";

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main key={pathname} className="page-fade pt-24 sm:pt-28">
      {children}
    </main>
  );
}
