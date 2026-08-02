#!/usr/bin/env tsx
/**
 * Local dev: run volunteer bot via long polling (no HTTPS/ngrok needed).
 *
 * Usage: npm run telegram:poll
 */

import { loadEnvFile } from "./load-env";
import { createVolunteerBot } from "@/lib/telegram/volunteer/bot";

loadEnvFile();

async function main() {
  const bot = createVolunteerBot();

  bot.catch((err) => {
    console.error("[volunteer-bot]", err);
  });

  const me = await bot.api.getMe();
  console.log(`✅ @${me.username} — polling started`);
  console.log("   Press Ctrl+C to stop\n");

  await bot.start({
    onStart: () => {},
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
