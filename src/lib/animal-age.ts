export function getAgeInMonths(birthDate: Date | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;

  let months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());

  if (now.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) return null;

  return months;
}

export function formatAnimalAge(
  birthDate: Date | null | undefined,
  locale: string,
): string {
  const months = getAgeInMonths(birthDate);
  if (months == null) return "—";

  if (months < 12) {
    return locale === "uk" ? `${months} міс.` : `${months} mo.`;
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (locale === "uk") {
    if (rest === 0) return `${years} р.`;
    return `${years} р. ${rest} міс.`;
  }

  if (rest === 0) return `${years} yr.`;
  return `${years} yr. ${rest} mo.`;
}

export const catalogAgeFilters = ["under_1", "1_5", "5_10", "10_plus"] as const;

export type CatalogAgeFilter = (typeof catalogAgeFilters)[number];

export function matchesCatalogAgeFilter(
  birthDate: Date | null | undefined,
  filter: CatalogAgeFilter,
): boolean {
  const months = getAgeInMonths(birthDate);
  if (months == null) return false;

  switch (filter) {
    case "under_1":
      return months < 12;
    case "1_5":
      return months >= 12 && months < 60;
    case "5_10":
      return months >= 60 && months < 120;
    case "10_plus":
      return months >= 120;
    default:
      return true;
  }
}

export function buildBirthDate(
  birthMonth: number | null | undefined,
  birthYear: number | null | undefined,
): Date | null {
  if (birthYear == null || !Number.isFinite(birthYear)) return null;

  const year = Math.trunc(birthYear);
  const month =
    birthMonth != null && birthMonth >= 1 && birthMonth <= 12
      ? Math.trunc(birthMonth) - 1
      : 0;

  return new Date(Date.UTC(year, month, 1));
}

export function splitBirthDate(birthDate: Date | null | undefined) {
  if (!birthDate) {
    return { birthMonth: null as number | null, birthYear: null as number | null };
  }

  return {
    birthMonth: birthDate.getUTCMonth() + 1,
    birthYear: birthDate.getUTCFullYear(),
  };
}

export const birthMonthLabelsUk = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
] as const;

export const birthMonthLabelsEn = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
