import type { InlineKeyboard } from "grammy";
import { TelegramBotType, TelegramSessionState } from "@prisma/client";
import type { Context } from "grammy";
import {
  getTelegramSession,
  resetTelegramSession,
  updateTelegramSession,
} from "@/lib/telegram/session";
import type {
  NavFrame,
  SessionUpdate,
  VolunteerSessionContext,
} from "@/lib/telegram/types";
import { frameContext } from "@/lib/telegram/types";
import { navOnlyKeyboard } from "@/lib/telegram/volunteer/messages";

export function appendNavRow(keyboard: InlineKeyboard): InlineKeyboard {
  return keyboard
    .row()
    .text("◀️ Назад", "nav:back")
    .text("🏠 Головне меню", "nav:home");
}

export async function transitionSession(
  chatId: bigint,
  update: SessionUpdate,
  options: { pushNav?: boolean } = {},
) {
  const pushNav = options.pushNav !== false;
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const currentStack = session.context.navStack ?? [];

  let navStack = currentStack;
  if (
    pushNav &&
    update.state !== undefined &&
    update.state !== session.state
  ) {
    const frame: NavFrame = {
      state: session.state,
      context: frameContext(session.context),
    };
    navStack = [...currentStack, frame].slice(-12);
  }

  const contextData: VolunteerSessionContext = {
    ...session.context,
    ...(update.contextData ?? {}),
    navStack,
  };

  return updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    ...update,
    contextData,
  });
}

export async function goHome(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const preserveContext = session.context.lastCuratorContact
    ? { lastCuratorContact: session.context.lastCuratorContact }
    : {};

  await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER, preserveContext);
  return chatId;
}

export async function popNavFrame(
  chatId: bigint,
): Promise<NavFrame | null> {
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const stack = session.context.navStack ?? [];
  if (!stack.length) return null;

  const frame = stack[stack.length - 1];
  const navStack = stack.slice(0, -1);

  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    state: frame.state,
    contextData: { ...frame.context, navStack },
    shelterId: session.shelterId,
  });

  return frame;
}

export function mergeContext(
  base: VolunteerSessionContext,
  patch: VolunteerSessionContext,
): VolunteerSessionContext {
  return {
    ...base,
    ...patch,
    navStack: patch.navStack ?? base.navStack,
    curatorDraft: patch.curatorDraft ?? base.curatorDraft,
    lastCuratorContact: patch.lastCuratorContact ?? base.lastCuratorContact,
  };
}

export async function replyWithNav(
  ctx: Context,
  text: string,
  extra?: { parse_mode?: "Markdown"; reply_markup?: InlineKeyboard },
) {
  const markup = extra?.reply_markup
    ? appendNavRow(extra.reply_markup)
    : navOnlyKeyboard();

  await ctx.reply(text, {
    parse_mode: extra?.parse_mode,
    reply_markup: markup,
  });
}

export function isFlowState(state: TelegramSessionState) {
  return state !== TelegramSessionState.IDLE;
}
