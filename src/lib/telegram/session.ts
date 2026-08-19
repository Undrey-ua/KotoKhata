import {
  TelegramBotType,
  TelegramSessionState,
  type TelegramSession,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { SessionUpdate, VolunteerSessionContext } from "@/lib/telegram/types";

const SESSION_TTL_HOURS = 24;

function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
}

function parseContext(data: unknown): VolunteerSessionContext {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }
  return data as VolunteerSessionContext;
}

export async function getTelegramSession(
  chatId: bigint,
  botType: TelegramBotType,
): Promise<TelegramSession & { context: VolunteerSessionContext }> {
  const existing = await prisma.telegramSession.findUnique({
    where: { chatId_botType: { chatId, botType } },
  });

  if (existing && existing.expiresAt >= new Date()) {
    return { ...existing, context: parseContext(existing.contextData) };
  }

  if (existing) {
    const reset = await prisma.telegramSession.update({
      where: { id: existing.id },
      data: {
        state: TelegramSessionState.IDLE,
        contextData: {},
        expiresAt: sessionExpiry(),
      },
    });
    return { ...reset, context: {} };
  }

  const created = await prisma.telegramSession.create({
    data: {
      chatId,
      botType,
      state: TelegramSessionState.IDLE,
      contextData: {},
      expiresAt: sessionExpiry(),
    },
  });

  return { ...created, context: {} };
}

export async function updateTelegramSession(
  chatId: bigint,
  botType: TelegramBotType,
  update: SessionUpdate,
) {
  const data: Prisma.TelegramSessionUpdateInput = {
    expiresAt: sessionExpiry(),
  };

  if (update.state !== undefined) data.state = update.state;
  if (update.contextData !== undefined) {
    data.contextData = update.contextData as Prisma.InputJsonValue;
  }
  if (update.shelterId !== undefined) data.shelterId = update.shelterId;

  return prisma.telegramSession.upsert({
    where: { chatId_botType: { chatId, botType } },
    create: {
      chatId,
      botType,
      state: update.state ?? TelegramSessionState.IDLE,
      contextData: (update.contextData ?? {}) as Prisma.InputJsonValue,
      shelterId: update.shelterId ?? null,
      expiresAt: sessionExpiry(),
    },
    update: data,
  });
}

export async function resetTelegramSession(
  chatId: bigint,
  botType: TelegramBotType,
  preserveContext: VolunteerSessionContext = {},
) {
  return updateTelegramSession(chatId, botType, {
    state: TelegramSessionState.IDLE,
    contextData: preserveContext,
  });
}

/** Atomically leave `fromState` and return its context (for idempotent FSM completion). */
export async function claimTelegramSessionState(
  chatId: bigint,
  botType: TelegramBotType,
  fromState: TelegramSessionState,
): Promise<VolunteerSessionContext | null> {
  const session = await prisma.telegramSession.findUnique({
    where: { chatId_botType: { chatId, botType } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  if (session.state !== fromState) {
    return null;
  }

  const context = parseContext(session.contextData);

  const result = await prisma.telegramSession.updateMany({
    where: {
      chatId,
      botType,
      state: fromState,
    },
    data: {
      state: TelegramSessionState.IDLE,
      contextData: {},
      expiresAt: sessionExpiry(),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return context;
}
