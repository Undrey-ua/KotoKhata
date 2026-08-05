import { ShelterMemberRole } from "@prisma/client";
import { z } from "zod";

const volunteerRoleSchema = z.enum([
  ShelterMemberRole.VOLUNTEER,
  ShelterMemberRole.VETERINARIAN,
  ShelterMemberRole.ADMIN,
]);

export const updateVolunteerFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
  role: volunteerRoleSchema,
  bio: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
  showOnContacts: z
    .union([z.literal("on"), z.literal("true"), z.literal("1"), z.undefined()])
    .transform((v) => v === "on" || v === "true" || v === "1"),
});

export type UpdateVolunteerFormInput = z.infer<typeof updateVolunteerFormSchema>;

export function parseUpdateVolunteerForm(formData: FormData): UpdateVolunteerFormInput {
  return updateVolunteerFormSchema.parse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    bio: formData.get("bio"),
    showOnContacts: formData.get("showOnContacts") ?? undefined,
  });
}
