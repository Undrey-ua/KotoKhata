import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireCuratorAnimal } from "@/lib/auth/curator";
import { getPublicHomeStatusShort } from "@/lib/animal-labels";
import { SafeImage } from "@/components/shared/safe-image";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { coverMediaUrl, mediaDisplayUrl } from "@/lib/serialize";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function CuratorLifePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { animal, session } = await requireCuratorAnimal(slug);
  const t = await getTranslations("curator");

  const cover = coverMediaUrl(animal.media.filter((m) => m.type === "PHOTO"));
  const stories = animal.lifeStories;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/my" className="text-sm text-slate hover:text-foreground">
          ← {t("backToDashboard")}
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            {t("logout")}
          </Button>
        </form>
      </div>

      <header className="mt-6 overflow-hidden rounded-2xl border border-border-cool bg-card shadow-sm">
        <div className="grid sm:grid-cols-[140px_1fr]">
          <div className="bg-surface-cool/50 p-4">
            {cover ? (
              <AnimalCardImage
                src={cover}
                name={animal.name}
                className="aspect-square w-full rounded-xl"
              />
            ) : (
              <AnimalCardImage src={null} name={animal.name} className="aspect-square w-full rounded-xl" />
            )}
          </div>
          <div className="flex flex-col justify-center p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("yourWard")}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">{animal.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {getPublicHomeStatusShort(animal.status)}
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-fit" asChild>
              <Link href={`/s/${animal.shelter.slug}/cats/${animal.slug}`}>
                {t("publicProfile")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t("lifeHistory")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("lifeHistoryHint")}</p>

        {stories.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-border-cool bg-card p-8 text-center text-sm text-muted-foreground">
            {t("noStories")}
          </p>
        ) : (
          <ol className="mt-6 space-y-5">
            {stories.map((story) => (
              <li
                key={story.id}
                className="relative rounded-2xl border border-border-cool bg-card p-5 shadow-sm"
              >
                <time className="text-xs text-muted-foreground">
                  {(story.publishedAt ?? story.createdAt).toLocaleDateString(
                    locale === "uk" ? "uk-UA" : "en-GB",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </time>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {story.content}
                </p>
                {story.author.fullName && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("fromVolunteer", { name: story.author.fullName })}
                  </p>
                )}
                {story.media.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {story.media.map((item) => (
                      <li
                        key={item.id}
                        className="h-20 w-20 overflow-hidden rounded-lg border border-border-cool"
                      >
                        <SafeImage
                          src={mediaDisplayUrl(item.id)}
                          alt=""
                          className="h-full w-full bg-surface-stone object-contain"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
