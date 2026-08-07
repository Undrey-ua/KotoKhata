import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getCrmAnimalsForNews } from "@/lib/crm/news-list";
import { Link } from "@/i18n/navigation";
import { NewsForm } from "@/components/crm/news-form";

export const dynamic = "force-dynamic";

export default async function CrmNewsNewPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const animals = await getCrmAnimalsForNews(ctx.shelterId);

  return (
    <div>
      <Link
        href={`/crm/${shelterSlug}/news`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Новини
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Нова публікація</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Додайте історію про котика або новину всього притулку.
      </p>

      <div className="mt-8">
        <NewsForm shelterSlug={shelterSlug} animals={animals} />
      </div>
    </div>
  );
}
