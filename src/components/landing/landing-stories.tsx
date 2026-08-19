import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/shared/safe-image";
import type { PublicFeedItem } from "@/lib/shelter-life-stories";
import { getTranslations } from "next-intl/server";

type LandingStoriesProps = {
  shelterSlug: string;
  stories: PublicFeedItem[];
  title: string;
  subtitle: string;
  viewAll: string;
  locale: string;
};

function formatStoryDate(date: Date | null, locale: string) {
  const value = date ?? new Date();
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", {
    day: "numeric",
    month: "long",
  }).format(value);
}

function storyPreview(content: string, max = 120) {
  const trimmed = content.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export async function LandingStories({
  shelterSlug,
  stories,
  title,
  subtitle,
  viewAll,
  locale,
}: LandingStoriesProps) {
  if (!stories.length) return null;

  const t = await getTranslations("shelterLife");

  return (
    <section className="bg-[var(--landing-beige)]/40 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--landing-text)] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-base text-[var(--landing-muted)]">
              {subtitle}
            </p>
          </div>
          <Link
            href={`/s/${shelterSlug}/life`}
            className="text-sm font-semibold text-[var(--landing-terracotta)]"
          >
            {viewAll} →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {stories.slice(0, 4).map((story) => {
            const photo = story.photoUrls[0];
            const isAnimal = story.type === "ANIMAL_STORY";
            const headline = isAnimal
              ? story.animal.name
              : (story.title ?? t("shelterNewsBadge"));

            return (
              <article
                key={story.id}
                className="flex gap-4 rounded-2xl bg-[var(--landing-card)] p-4 shadow-sm sm:p-5"
              >
                {photo ? (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--landing-beige)] sm:h-28 sm:w-28">
                    <SafeImage
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-beige)] text-2xl sm:h-28 sm:w-28">
                    🐾
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--landing-muted)]">
                    {formatStoryDate(
                      story.publishedAt ?? story.createdAt,
                      locale,
                    )}
                  </p>
                  <h3 className="mt-1 truncate text-base font-semibold text-[var(--landing-text)]">
                    {headline}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--landing-muted)]">
                    {storyPreview(story.content)}
                  </p>
                  {story.authorName && (
                    <p className="mt-2 text-xs text-[var(--landing-muted)]">
                      {t("fromVolunteer", { name: story.authorName })}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
