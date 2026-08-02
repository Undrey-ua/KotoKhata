import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { createAnimalAction } from "@/actions/animals";
import { AnimalForm } from "@/components/crm/animal-form";

export const dynamic = "force-dynamic";

export default async function NewAnimalPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  await requireShelterMember(shelterSlug);
  const saveAction = createAnimalAction.bind(null, shelterSlug);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Новий котик</h1>
      <AnimalForm shelterSlug={shelterSlug} saveAction={saveAction} />
    </div>
  );
}
