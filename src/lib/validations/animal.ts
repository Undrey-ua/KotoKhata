import {
  AnimalPersonality,
  AnimalSex,
  AnimalStatus,
} from "@prisma/client";
import { z } from "zod";
import { buildBirthDate } from "@/lib/animal-age";

const currentYear = new Date().getFullYear();

export const animalFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Invalid slug"),
    sex: z.nativeEnum(AnimalSex),
    status: z.nativeEnum(AnimalStatus),
    personality: z.nativeEnum(AnimalPersonality),
    description: z.string().max(2000).optional(),
    characterTraits: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
    vaccinated: z.boolean(),
    sterilized: z.boolean(),
    isPublic: z.boolean(),
    isFeatured: z.boolean(),
    monthlyGoal: z.coerce.number().positive().optional().nullable(),
    minCuratorshipAmount: z.coerce.number().positive().optional().nullable(),
    birthMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
    birthYear: z.coerce
      .number()
      .int()
      .min(1990)
      .max(currentYear)
      .optional()
      .nullable(),
  })
  .transform((data) => ({
    ...data,
    birthDate: buildBirthDate(data.birthMonth, data.birthYear),
  }));

export type AnimalFormInput = z.infer<typeof animalFormSchema>;

export function parseAnimalForm(formData: FormData): AnimalFormInput {
  return animalFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sex: formData.get("sex"),
    status: formData.get("status"),
    personality: formData.get("personality"),
    description: formData.get("description") || undefined,
    characterTraits: formData.get("characterTraits") || undefined,
    location: formData.get("location") || undefined,
    vaccinated: formData.get("vaccinated") === "on",
    sterilized: formData.get("sterilized") === "on",
    isPublic: formData.get("isPublic") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    monthlyGoal: parseOptionalNumber(formData.get("monthlyGoal")),
    minCuratorshipAmount: parseOptionalNumber(formData.get("minCuratorshipAmount")),
    birthMonth: parseOptionalInt(formData.get("birthMonth")),
    birthYear: parseOptionalInt(formData.get("birthYear")),
  });
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
