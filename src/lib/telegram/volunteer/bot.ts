import { Bot } from "grammy";
import { getTelegramVolunteerConfig } from "@/lib/env";
import { registerVolunteerHandlers } from "@/lib/telegram/volunteer/handlers";

let botInstance: Bot | undefined;

export function createVolunteerBot() {
  const { token } = getTelegramVolunteerConfig();
  if (!token) {
    throw new Error("TELEGRAM_VOLUNTEER_BOT_TOKEN is not configured");
  }

  const bot = new Bot(token);
  registerVolunteerHandlers(bot);
  return bot;
}

export function getVolunteerBot() {
  if (!botInstance) {
    botInstance = createVolunteerBot();
  }
  return botInstance;
}

export function isVolunteerBotConfigured() {
  return Boolean(getTelegramVolunteerConfig().token);
}
