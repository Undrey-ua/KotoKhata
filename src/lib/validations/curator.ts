import { z } from "zod";
import { SponsorshipStatus } from "@prisma/client";

export const createCuratorFormSchema = z.object({
  email: z.string().email("Невірний email"),
  fullName: z.string().min(1, "Вкажіть ім'я").max(100),
  phone: z.string().max(30).optional(),
  animalId: z.string().uuid("Оберіть котика"),
  monthlyAmount: z.coerce.number().positive("Сума має бути більше 0"),
  status: z.enum([SponsorshipStatus.ACTIVE, SponsorshipStatus.PENDING]),
  message: z.string().max(500).optional(),
});

export type CreateCuratorFormInput = z.infer<typeof createCuratorFormSchema>;

export function parseCreateCuratorForm(formData: FormData): CreateCuratorFormInput {
  return createCuratorFormSchema.parse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    animalId: formData.get("animalId"),
    monthlyAmount: formData.get("monthlyAmount"),
    status: formData.get("status") ?? SponsorshipStatus.ACTIVE,
    message: formData.get("message") || undefined,
  });
}
