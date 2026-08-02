#!/usr/bin/env tsx
/**
 * Register Telegram webhooks for local/production.
 *
 * Usage:
 *   npx tsx scripts/setup-telegram-webhooks.ts
 *   npx tsx scripts/setup-telegram-webhooks.ts --volunteer-only
 */

import { randomBytes } from "crypto";

const args = process.argv.slice(2);
const volunteerOnly = args.includes("--volunteer-only");

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function secretOrGenerate(existing?: string) {
  return existing || randomBytes(16).toString("hex");
}

async function setWebhook(
  label: string,
  token: string | undefined,
  path: string,
  secret: string | undefined,
) {
  if (!token) {
    console.log(`⏭  ${label}: token not set, skipping`);
    return;
  }

  const webhookSecret = secretOrGenerate(secret);
  const url = `${appUrl()}${path}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };

  if (!data.ok) {
    console.error(`❌ ${label}: ${data.description ?? "failed"}`);
    return;
  }

  console.log(`✅ ${label}: ${url}`);
  if (!secret) {
    console.log(`   Add to .env: TELEGRAM_${label.toUpperCase()}_WEBHOOK_SECRET=${webhookSecret}`);
  }
}

async function main() {
  console.log(`App URL: ${appUrl()}\n`);

  await setWebhook(
    "VOLUNTEER",
    process.env.TELEGRAM_VOLUNTEER_BOT_TOKEN,
    "/api/webhooks/telegram/volunteer",
    process.env.TELEGRAM_VOLUNTEER_WEBHOOK_SECRET,
  );

  if (!volunteerOnly) {
    await setWebhook(
      "SPONSOR",
      process.env.TELEGRAM_SPONSOR_BOT_TOKEN,
      "/api/webhooks/telegram/sponsor",
      process.env.TELEGRAM_SPONSOR_WEBHOOK_SECRET,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
