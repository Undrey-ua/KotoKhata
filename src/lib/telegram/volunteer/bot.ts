import { Bot } from "grammy";
import { getTelegramVolunteerConfig } from "@/lib/env";
import { registerVolunteerHandlers } from "@/lib/telegram/volunteer/handlers";

let botInstance: Bot | undefined;
let handlersRegistered = false;

export function createVolunteerBot() {
  const { token } = getTelegramVolunteerConfig();
  if (!token) {
    throw new Error("TELEGRAM_VOLUNTEER_BOT_TOKEN is not configured");
  }

  const bot = new Bot(token);

  if (!handlersRegistered) {
    const seenUpdates = new Set<number>();

    bot.use(async (ctx, next) => {
      const updateId = ctx.update.update_id;
      if (seenUpdates.has(updateId)) {
        return;
      }
      seenUpdates.add(updateId);

      if (seenUpdates.size > 2000) {
        for (const id of [...seenUpdates].slice(0, 1000)) {
          seenUpdates.delete(id);
        }
      }

      await next();
    });

    registerVolunteerHandlers(bot);
    handlersRegistered = true;
  }

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
