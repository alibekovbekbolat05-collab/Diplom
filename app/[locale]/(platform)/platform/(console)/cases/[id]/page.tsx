import { CasesView } from "@/components/platform/cases";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CasesView initialId={id} />;
}
