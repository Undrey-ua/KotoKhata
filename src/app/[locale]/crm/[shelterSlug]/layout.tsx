import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { CrmNav } from "@/components/crm/crm-nav";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);

  const ctx = await requireShelterMember(shelterSlug);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-surface-cool/30 lg:flex-row">
      <CrmNav shelterSlug={shelterSlug} shelterName={ctx.shelter.name} />
      <div className="flex-1 p-3 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
