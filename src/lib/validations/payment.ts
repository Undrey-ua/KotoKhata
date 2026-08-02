import { z } from "zod";

const amountField = z.coerce.number().positive("Сума має бути більше 0");

export const donateFormSchema = z.object({
  amount: amountField,
  fullName: z.string().min(1, "Вкажіть ім'я").max(100).optional(),
  email: z.string().email("Невірний email").optional(),
  message: z.string().max(500).optional(),
});

export const sponsorFormSchema = z.object({
  monthlyAmount: amountField,
  fullName: z.string().min(1, "Вкажіть ім'я").max(100).optional(),
  email: z.string().email("Невірний email").optional(),
  password: z.string().min(6, "Пароль — мінімум 6 символів").optional(),
  message: z.string().max(500).optional(),
});

export type DonateFormInput = z.infer<typeof donateFormSchema>;
export type SponsorFormInput = z.infer<typeof sponsorFormSchema>;
