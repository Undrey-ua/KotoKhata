import { InlineKeyboard } from "grammy";
import { ShelterMemberRole, TelegramBotType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl, isPublicHttpsUrl } from "@/lib/env";
import { getVolunteerBot } from "@/lib/telegram/volunteer/bot";
import { mainMenuKeyboard } from "@/lib/telegram/volunteer/messages";

type AccessRequestNotification = {
  id: string;
  fullName: string;
  email: string | null;
  telegramUsername: string | null;
  telegramChatId: bigint;
  shelterSlug: string;
};

export function adminAccessReviewKeyboard(requestId: string) {
  return new InlineKeyboard()
    .text("✅ Схвалити", `access:approve:${requestId}`)
    .text("❌ Відхилити", `access:reject:${requestId}`);
}

export async function notifyAdminsOfAccessRequest(
  shelterId: string,
  request: AccessRequestNotification,
) {
  const admins = await prisma.shelterMember.findMany({
    where: { shelterId, role: ShelterMemberRole.ADMIN },
    include: {
      user: {
        include: {
          telegramAccounts: {
            where: { botType: TelegramBotType.VOLUNTEER },
          },
        },
      },
    },
  });

  const chatIds = admins.flatMap((admin) =>
    admin.user.telegramAccounts.map((account) => account.chatId),
  );

  if (!chatIds.length) return;

  const username = request.telegramUsername
    ? `@${request.telegramUsername}`
    : "немає";
  const email = request.email ?? "не вказано";
  const crmUrl = `${getAppUrl()}/uk/crm/${request.shelterSlug}/volunteers`;

  const text = [
    "📝 *Новий запит на доступ волонтера*",
    "",
    `*Ім'я:* ${request.fullName}`,
    `*Email:* ${email}`,
    `*Telegram:* ${username}`,
    "",
    "Схваліть тут або в CRM.",
  ].join("\n");

  const bot = getVolunteerBot();
  const keyboard = adminAccessReviewKeyboard(request.id);

  if (isPublicHttpsUrl(crmUrl)) {
    keyboard.row().url("Відкрити CRM", crmUrl);
  }

  await Promise.allSettled(
    chatIds.map((chatId) =>
      bot.api.sendMessage(Number(chatId), text, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }),
    ),
  );
}

export async function notifyVolunteerAccessApproved(chatId: bigint, shelterName: string) {
  const bot = getVolunteerBot();
  await bot.api.sendMessage(
    Number(chatId),
    `✅ *Доступ схвалено!*\n\nПритулок: *${shelterName}*\n\nТепер можете додавати котиків і публікувати новини.`,
    { parse_mode: "Markdown", reply_markup: mainMenuKeyboard() },
  );
}

export async function notifyVolunteerAccessRejected(chatId: bigint) {
  const bot = getVolunteerBot();
  await bot.api.sendMessage(
    Number(chatId),
    "❌ Запит на доступ відхилено.\n\nМожете надіслати новий запит через /start.",
  );
}
