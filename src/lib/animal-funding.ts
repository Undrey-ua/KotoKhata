import type { Decimal } from "@prisma/client/runtime/library";
import { SponsorshipStatus, CuratorRelationshipStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AnimalFundingInfo = {
  monthlyGoal: number | null;
  minCuratorshipAmount: number | null;
  fundedMonthly: number;
  fundedPercent: number | null;
  hasCurators: boolean;
  isFullyFunded: boolean;
};

export function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value == null) return null;
  return Number(value);
}

export function computeFundingInfo(
  monthlyGoal: Decimal | null | undefined,
  minCuratorshipAmount: Decimal | null | undefined,
  fundedMonthly: number,
): AnimalFundingInfo {
  const goal = decimalToNumber(monthlyGoal);
  const minAmount = decimalToNumber(minCuratorshipAmount);
  const hasCurators = fundedMonthly > 0;

  let fundedPercent: number | null = null;
  if (goal != null && goal > 0) {
    fundedPercent = Math.min(100, Math.round((fundedMonthly / goal) * 100));
  }

  return {
    monthlyGoal: goal,
    minCuratorshipAmount: minAmount,
    fundedMonthly,
    fundedPercent,
    hasCurators,
    isFullyFunded: fundedPercent === 100,
  };
}

export async function getAnimalFunding(animalId: string): Promise<AnimalFundingInfo> {
  const [animal, aggregate] = await Promise.all([
    prisma.animal.findUnique({
      where: { id: animalId },
      select: { monthlyGoal: true, minCuratorshipAmount: true },
    }),
    prisma.sponsorship.aggregate({
      where: {
        animalId,
        status: SponsorshipStatus.ACTIVE,
        curatorStatus: CuratorRelationshipStatus.ACTIVE,
      },
      _sum: { monthlyAmount: true },
    }),
  ]);

  const fundedMonthly = Number(aggregate._sum.monthlyAmount ?? 0);
  return computeFundingInfo(
    animal?.monthlyGoal,
    animal?.minCuratorshipAmount,
    fundedMonthly,
  );
}

export async function getAnimalsFunding(
  animals: { id: string; monthlyGoal: Decimal | null; minCuratorshipAmount: Decimal | null }[],
): Promise<Map<string, AnimalFundingInfo>> {
  if (animals.length === 0) return new Map();

  const ids = animals.map((a) => a.id);
  const aggregates = await prisma.sponsorship.groupBy({
    by: ["animalId"],
    where: {
      animalId: { in: ids },
      status: SponsorshipStatus.ACTIVE,
      curatorStatus: CuratorRelationshipStatus.ACTIVE,
    },
    _sum: { monthlyAmount: true },
  });

  const sumByAnimal = new Map(
    aggregates.map((row) => [row.animalId, Number(row._sum.monthlyAmount ?? 0)]),
  );

  return new Map(
    animals.map((animal) => [
      animal.id,
      computeFundingInfo(
        animal.monthlyGoal,
        animal.minCuratorshipAmount,
        sumByAnimal.get(animal.id) ?? 0,
      ),
    ]),
  );
}

/** Deterministic UAH formatting — avoids SSR/client Intl mismatches (₴ vs грн). */
export function formatUah(amount: number, locale = "uk") {
  const n = Math.round(amount);
  const formatted = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return locale === "en" ? `${formatted} UAH` : `${formatted} ₴`;
}
