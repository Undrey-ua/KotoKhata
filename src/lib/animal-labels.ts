import {
  AnimalPersonality,
  AnimalSex,
  AnimalStatus,
} from "@prisma/client";

/** Internal / CRM labels (funding workflow). */
export const statusLabels: Record<AnimalStatus, string> = {
  SEEKING_SPONSOR: "❤️ Шукає опікуна",
  PARTIALLY_FUNDED: "💚 Частково забезпечений",
  FULLY_SPONSORED: "🤝 Має опікунів",
  SEEKING_HOME: "🏡 Шукає дім",
  ADOPTED: "🎉 Прилаштований",
  PERMANENT_RESIDENT: "🏡 Шукає дім", // legacy — treated as seeking home
};

/** Statuses available in CRM dropdown. */
export const crmStatusOptions: AnimalStatus[] = [
  AnimalStatus.SEEKING_HOME,
  AnimalStatus.PARTIALLY_FUNDED,
  AnimalStatus.FULLY_SPONSORED,
  AnimalStatus.ADOPTED,
];

export function isAdopted(status: AnimalStatus) {
  return status === AnimalStatus.ADOPTED;
}

/** Public site: every cat seeks a home until adopted. */
export function getPublicHomeStatusLabel(status: AnimalStatus) {
  return isAdopted(status) ? statusLabels.ADOPTED : statusLabels.SEEKING_HOME;
}

export function getPublicHomeStatusShort(status: AnimalStatus) {
  return isAdopted(status) ? "Нарешті вдома" : "Шукає дім";
}

export function getCrmStatusLabel(status: AnimalStatus) {
  if (status === AnimalStatus.SEEKING_SPONSOR || status === AnimalStatus.PERMANENT_RESIDENT) {
    return statusLabels.SEEKING_HOME;
  }
  return statusLabels[status];
}

export const sexLabels: Record<AnimalSex, string> = {
  MALE: "Хлопчик",
  FEMALE: "Дівчинка",
  UNKNOWN: "Невідомо",
};

export const personalityLabels: Record<AnimalPersonality, string> = {
  PLAYFUL: "Грайливий",
  CALM: "Спокійний",
  SHY: "Сором'язливий",
  SERIOUS: "Серйозний",
  KITTEN: "Кошеня",
};
