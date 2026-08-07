import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getCrmNewsList } from "@/lib/crm/news-list";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { NewsListPanel } from "@/components/crm/news-list-panel";

export const dynamic = "force-dynamic";

export default async function CrmNewsPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const rows = await getCrmNewsList(ctx.shelterId);
  const published = rows.filter((row) => row.isPublic).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Новини</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} записів
            {published > 0 && ` · ${published} на сайті`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/crm/${shelterSlug}/news/new`}>+ Додати</Link>
        </Button>
      </div>

      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Публікуйте історії про котиків і загальні новини притулку — збори, звіти,
        подяки. Вони з&apos;являться у стрічці{" "}
        <Link href={`/s/${shelterSlug}/life`} className="text-primary hover:underline">
          «Життя притулку»
        </Link>{" "}
        на сайті.
      </p>

      <NewsListPanel rows={rows} shelterSlug={shelterSlug} />
    </div>
  );
}
