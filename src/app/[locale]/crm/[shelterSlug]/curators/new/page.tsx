import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireShelterMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createCuratorAction } from "@/actions/curators";
import { CuratorForm } from "@/components/crm/curator-form";
import { decimalToNumber } from "@/lib/animal-funding";

export const dynamic = "force-dynamic";

export default async function NewCuratorPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const animals = await prisma.animal.findMany({
    where: { shelterId: ctx.shelterId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      minCuratorshipAmount: true,
    },
  });

  const saveAction = createCuratorAction.bind(null, shelterSlug);

  return (
    <div>
      <Link
        href={`/crm/${shelterSlug}/curators`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Усі куратори
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold text-foreground">Новий куратор</h1>
      {animals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-cool bg-card p-8 text-center text-muted-foreground">
          Спочатку додайте котика, потім можна оформити кураторство.
        </p>
      ) : (
        <CuratorForm
          shelterSlug={shelterSlug}
          animals={animals.map((a) => ({
            id: a.id,
            name: a.name,
            minCuratorshipAmount: decimalToNumber(a.minCuratorshipAmount),
          }))}
          saveAction={saveAction}
        />
      )}
    </div>
  );
}
