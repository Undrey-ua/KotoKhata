import { webhookCallback } from "grammy";
import { getTelegramVolunteerConfig } from "@/lib/env";
import {
  getVolunteerBot,
  isVolunteerBotConfigured,
} from "@/lib/telegram/volunteer/bot";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isVolunteerBotConfigured()) {
    return new Response("Volunteer bot not configured", { status: 503 });
  }

  const { webhookSecret } = getTelegramVolunteerConfig();
  if (webhookSecret) {
    const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (secret !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const handler = webhookCallback(getVolunteerBot(), "std/http");
  return handler(req);
}
