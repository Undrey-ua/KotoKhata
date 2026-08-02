import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { logoutAction } from "@/actions/auth";
import { getActiveSponsorships, requireCuratorSession } from "@/lib/auth/curator";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { Button } from "@/components/ui/button";
import { coverMediaUrl } from "@/lib/serialize";
import { getPublicHomeStatusShort } from "@/lib/animal-labels";

export const dynamic = "force-dynamic";

export default async function CuratorDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireCuratorSession();
  const t = await getTranslations("curator");

  const sponsorships = await getActiveSponsorships(session.appUser.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboardTitle")}</h1>
          <p className="mt-1 text-muted-foreground">
            {session.appUser.fullName ?? session.appUser.email}
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            {t("logout")}
          </Button>
        </form>
      </div>

      {sponsorships.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border-cool bg-card p-10 text-center">
          <p className="text-lg font-medium text-foreground">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyDesc")}</p>
          <Button className="mt-6" asChild>
            <Link href="/s/kotoxata/cats">{t("browseCats")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {sponsorships.map(({ animal }) => (
            <li key={animal.id}>
              <Link
                href={`/my/${animal.slug}`}
                className="flex gap-4 overflow-hidden rounded-2xl border border-border-cool bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <AnimalCardImage
                    src={coverMediaUrl(animal.media)}
                    name={animal.name}
                    className="h-24 w-24"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-lg font-semibold text-foreground">{animal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getPublicHomeStatusShort(animal.status)}
                  </p>
                  <p className="mt-1 text-sm text-primary">{t("openLifePage")} →</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
