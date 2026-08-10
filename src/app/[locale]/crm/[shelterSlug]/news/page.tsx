import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import {
  countCrmPublishedNews,
  getCrmNewsListPaginated,
} from "@/lib/crm/news-list";
import { parsePageParam } from "@/lib/pagination";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { NewsListPanel } from "@/components/crm/news-list-panel";
import { ListPagination } from "@/components/ui/list-pagination";

export const dynamic = "force-dynamic";

export default async function CrmNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);
  const page = parsePageParam(resolvedSearchParams.page);

  const [result, published] = await Promise.all([
    getCrmNewsListPaginated(ctx.shelterId, { page }),
    countCrmPublishedNews(ctx.shelterId),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Новини</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} записів
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

      <NewsListPanel rows={result.items} shelterSlug={shelterSlug} />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        pathname={`/crm/${shelterSlug}/news`}
      />
    </div>
  );
}
