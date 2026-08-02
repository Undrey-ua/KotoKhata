#!/usr/bin/env tsx
/**
 * Generate a /link code for a volunteer (local testing).
 *
 * Usage:
 *   npx tsx scripts/generate-volunteer-link-code.ts
 *   npx tsx scripts/generate-volunteer-link-code.ts admin@kotoxata.org
 */

import { TelegramBotType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createTelegramLinkCode } from "@/lib/telegram/link";

async function main() {
  const email = process.argv[2] ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim();

  if (!email) {
    console.error("Usage: npx tsx scripts/generate-volunteer-link-code.ts user@email.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      shelterMemberships: { include: { shelter: true } },
    },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    console.error("Log in on the site first so the account is synced.");
    process.exit(1);
  }

  if (!user.shelterMemberships.length) {
    console.error(`No shelter membership for ${email}`);
    process.exit(1);
  }

  const { code, expiresAt } = await createTelegramLinkCode(
    user.id,
    TelegramBotType.VOLUNTEER,
  );

  const shelter = user.shelterMemberships[0].shelter;

  console.log(`User:    ${user.email}`);
  console.log(`Shelter: ${shelter.name}`);
  console.log(`Expires: ${expiresAt.toLocaleString("uk-UA")}`);
  console.log(`\nSend to @Kotoxata_Volunteer_bot:\n\n  /link ${code}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
