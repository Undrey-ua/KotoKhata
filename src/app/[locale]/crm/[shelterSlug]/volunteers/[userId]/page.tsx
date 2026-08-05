import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ShelterMemberRole } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { requireShelterMember } from "@/lib/auth/session";
import { getVolunteerDetail } from "@/lib/crm/volunteers";
import { VolunteerProfileForm } from "@/components/crm/volunteer-profile-form";
import { RevokeVolunteerButton } from "@/components/crm/revoke-volunteer-button";

export const dynamic = "force-dynamic";

const roleLabels: Record<ShelterMemberRole, string> = {
  ADMIN: "Адмін",
  VOLUNTEER: "Волонтер",
  VETERINARIAN: "Ветеринар",
};

function formatDate(date: Date, locale: string) {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-GB" : "uk-UA");
}

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string; userId: string }>;
}) {
  const { locale, shelterSlug, userId } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const volunteer = await getVolunteerDetail(ctx.shelterId, userId);
  if (!volunteer) {
    notFound();
  }

  const displayName = volunteer.fullName ?? volunteer.email;
  const isSelf = volunteer.userId === ctx.userId;
  const canRevoke = ctx.isAdmin && !isSelf;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/crm/${shelterSlug}/volunteers`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Усі волонтери
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground">
          {roleLabels[volunteer.role]} · у команді з{" "}
          {formatDate(volunteer.joinedAt, locale)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Контакти</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${volunteer.email}`} className="text-primary hover:underline">
                  {volunteer.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {volunteer.phone ? (
                  <a href={`tel:${volunteer.phone}`} className="font-medium hover:underline">
                    {volunteer.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Не вказано</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Telegram</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                {volunteer.telegram.linked ? (
                  <span className="font-medium">
                    {volunteer.telegram.username
                      ? `@${volunteer.telegram.username}`
                      : "Прив’язано"}
                    {volunteer.telegram.linkedAt && (
                      <span className="ml-1 text-muted-foreground">
                        · {formatDate(volunteer.telegram.linkedAt, locale)}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Не прив’язано</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Активність у CRM</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Історії життя</dt>
              <dd className="mt-0.5 text-lg font-bold text-foreground">
                {volunteer.activity.lifeStories}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Медзаписи</dt>
              <dd className="mt-0.5 text-lg font-bold text-foreground">
                {volunteer.activity.medicalRecords}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Зміни статусу</dt>
              <dd className="mt-0.5 text-lg font-bold text-foreground">
                {volunteer.activity.statusChanges}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Про волонтера</h2>
        {volunteer.bio ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{volunteer.bio}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Опис ще не додано.</p>
        )}
        {volunteer.showOnContacts && (
          <p className="mt-3 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Відображається на сторінці «Контакти»
          </p>
        )}
      </section>

      {ctx.isAdmin && (
        <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Редагування</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Контакти, роль, опис і видимість на сайті.
          </p>
          <div className="mt-4">
            <VolunteerProfileForm shelterSlug={shelterSlug} volunteer={volunteer} />
          </div>
        </section>
      )}

      {ctx.isAdmin && (
        <RevokeVolunteerButton
          shelterSlug={shelterSlug}
          memberId={volunteer.memberId}
          volunteerName={displayName}
          blocked={!canRevoke}
          blockedReason={
            isSelf ? "Не можна забрати доступ у самого себе" : undefined
          }
        />
      )}
    </div>
  );
}
