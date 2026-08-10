import { Bot, Context } from "grammy";
import {
  LifeStoryType,
  ShelterMemberRole,
  TelegramBotType,
  TelegramSessionState,
  VolunteerAccessRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  createAnimalFromTelegram,
  listShelterAnimals,
} from "@/lib/telegram/create-animal";
import { publishNewsFromTelegram } from "@/lib/telegram/create-life-story";
import { downloadTelegramPhoto } from "@/lib/telegram/download";
import {
  getLinkedVolunteer,
  redeemTelegramLinkCode,
} from "@/lib/telegram/link";
import {
  claimTelegramSessionState,
  getTelegramSession,
  resetTelegramSession,
  updateTelegramSession,
} from "@/lib/telegram/session";
import {
  approveVolunteerAccessRequest,
  createVolunteerAccessRequest,
  getDefaultVolunteerShelter,
  getPendingAccessRequest,
  rejectVolunteerAccessRequest,
} from "@/lib/telegram/volunteer-access";
import {
  notifyAdminsOfAccessRequest,
  notifyVolunteerAccessApproved,
  notifyVolunteerAccessRejected,
} from "@/lib/telegram/notify-admins";
import {
  accessSkipEmailKeyboard,
  afterAnimalKeyboard,
  mainMenuKeyboard,
  newsAnimalKeyboard,
  newsSkipPhotoKeyboard,
  MSG,
  unlinkedUserKeyboard,
} from "@/lib/telegram/volunteer/messages";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function showMainMenu(ctx: Context, shelterName?: string) {
  const chatId = BigInt(ctx.chat!.id);

  if (shelterName) {
    await ctx.reply(MSG.welcomeLinked(shelterName), {
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const pending = await getPendingAccessRequest(chatId);
  if (pending) {
    await ctx.reply(MSG.welcomePending(pending.shelter.name), {
      parse_mode: "Markdown",
    });
    return;
  }

  await ctx.reply(MSG.welcomeUnlinked, {
    parse_mode: "Markdown",
    reply_markup: unlinkedUserKeyboard(),
  });
}

async function requireVolunteer(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await getLinkedVolunteer(chatId);

  if (!linked?.shelter) {
    const pending = await getPendingAccessRequest(chatId);
    if (pending) {
      await ctx.reply(MSG.welcomePending(pending.shelter.name), {
        parse_mode: "Markdown",
      });
    } else {
      await ctx.reply(MSG.needLink, {
        reply_markup: unlinkedUserKeyboard(),
      });
    }
    return null;
  }

  return linked;
}

async function requireShelterAdmin(ctx: Context, shelterId: string) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await getLinkedVolunteer(chatId);

  if (
    !linked?.membership ||
    linked.membership.role !== ShelterMemberRole.ADMIN ||
    linked.membership.shelterId !== shelterId
  ) {
    await ctx.answerCallbackQuery({
      text: MSG.accessNotAdmin,
      show_alert: true,
    });
    return null;
  }

  return linked;
}

async function submitAccessRequest(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const fullName = session.context.fullName;
  const shelterId = session.shelterId;

  if (!fullName || !shelterId) {
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await showMainMenu(ctx);
    return;
  }

  const email = session.context.email;

  try {
    const request = await createVolunteerAccessRequest({
      shelterId,
      chatId,
      username: ctx.from?.username,
      fullName,
      email: email ?? null,
    });

    await notifyAdminsOfAccessRequest(shelterId, {
      id: request.id,
      fullName: request.fullName,
      email: request.email,
      telegramUsername: request.telegramUsername,
      telegramChatId: request.telegramChatId,
      shelterSlug: request.shelter.slug,
    });

    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await ctx.reply(MSG.accessSubmitted(request.shelter.name), {
      parse_mode: "Markdown",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_MEMBER") {
        await ctx.reply(MSG.accessAlreadyMember);
        return;
      }
      if (error.message === "ALREADY_PENDING") {
        await ctx.reply(MSG.accessAlreadyPending);
        return;
      }
      if (error.message === "EMAIL_ALREADY_MEMBER") {
        await ctx.reply(MSG.accessEmailTaken);
        return;
      }
    }
    await ctx.reply("Не вдалося надіслати запит. Спробуйте пізніше.");
  }
}

async function startNewAnimalFlow(ctx: Context) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const chatId = BigInt(ctx.chat!.id);
  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    state: TelegramSessionState.NEW_ANIMAL_PHOTO,
    contextData: {},
    shelterId: linked.shelter.id,
  });

  await ctx.reply(MSG.newAnimalPhoto);
}

async function handleNewAnimalPhoto(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const photos = ctx.message?.photo;

  if (!photos?.length) {
    await ctx.reply(MSG.newAnimalInvalidPhoto, { parse_mode: "Markdown" });
    return;
  }

  const largest = photos[photos.length - 1];

  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    state: TelegramSessionState.NEW_ANIMAL_NAME,
    contextData: {
      photoFileId: largest.file_id,
    },
  });

  await ctx.reply(MSG.newAnimalName);
}

async function handleNewAnimalName(ctx: Context, name: string) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await requireVolunteer(ctx);

  if (!linked) return;

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    await ctx.reply(MSG.newAnimalInvalidName);
    return;
  }

  const claimed = await claimTelegramSessionState(
    chatId,
    TelegramBotType.VOLUNTEER,
    TelegramSessionState.NEW_ANIMAL_NAME,
  );

  const photoFileId = claimed?.photoFileId;
  if (!photoFileId) {
    return;
  }

  try {
    const { buffer, mimeType } = await downloadTelegramPhoto(photoFileId);
    const animal = await createAnimalFromTelegram({
      shelterId: linked.shelter.id,
      name: trimmed,
      photoBuffer: buffer,
      photoMimeType: mimeType,
    });

    await ctx.reply(MSG.newAnimalDone(animal.name), {
      parse_mode: "Markdown",
      reply_markup: afterAnimalKeyboard(),
    });
  } catch {
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await ctx.reply(MSG.uploadFailed);
    await showMainMenu(ctx, linked.shelter.name);
  }
}

async function handleLinkCommand(ctx: Context, code: string) {
  const chatId = BigInt(ctx.chat!.id);
  const result = await redeemTelegramLinkCode({
    code,
    chatId,
    username: ctx.from?.username,
    botType: TelegramBotType.VOLUNTEER,
  });

  if (!result.ok) {
    const messages = {
      invalid: MSG.linkInvalid,
      expired: MSG.linkExpired,
      used: MSG.linkUsed,
      not_member: MSG.linkNotMember,
    } as const;
    await ctx.reply(messages[result.error]);
    return;
  }

  if (result.shelter) {
    await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
      state: TelegramSessionState.IDLE,
      contextData: {},
      shelterId: result.shelter.id,
    });
    await ctx.reply(MSG.linkSuccess(result.shelter.name), {
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  await ctx.reply(MSG.linkNotMember);
}

async function showMyCats(ctx: Context) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const animals = await listShelterAnimals(linked.shelter.id);

  if (!animals.length) {
    await ctx.reply(MSG.myCatsEmpty, { reply_markup: mainMenuKeyboard() });
    return;
  }

  const lines = animals.map((a) => `• ${a.name}`).join("\n");
  await ctx.reply(`${MSG.myCatsHeader}\n\n${lines}`, {
    reply_markup: mainMenuKeyboard(),
  });
}

async function startNewsFlow(ctx: Context) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const chatId = BigInt(ctx.chat!.id);
  const animals = await listShelterAnimals(linked.shelter.id, 8);

  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    state: TelegramSessionState.NEWS_SELECT_ANIMAL,
    contextData: {},
    shelterId: linked.shelter.id,
  });

  await ctx.reply(MSG.newsSelectTarget, {
    reply_markup: newsAnimalKeyboard(animals),
  });
}

async function proceedToNewsPhotoStep(ctx: Context, chatId: bigint) {
  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    state: TelegramSessionState.NEWS_UPLOAD_MEDIA,
  });

  await ctx.reply(MSG.newsUploadPhoto, {
    reply_markup: newsSkipPhotoKeyboard(),
  });
}

async function handleNewsPhoto(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const photos = ctx.message?.photo;

  if (session.state !== TelegramSessionState.NEWS_UPLOAD_MEDIA) return;
  if (!photos?.length) return;

  const largest = photos[photos.length - 1];

  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    state: TelegramSessionState.NEWS_WRITE_TEXT,
    contextData: {
      ...session.context,
      photoFileId: largest.file_id,
    },
  });

  await ctx.reply(MSG.newsWriteText);
}

async function handleNewsText(ctx: Context, text: string) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await requireVolunteer(ctx);

  if (!linked?.shelter) return;

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 4000) {
    await ctx.reply(MSG.newsInvalidText);
    return;
  }

  const claimed = await claimTelegramSessionState(
    chatId,
    TelegramBotType.VOLUNTEER,
    TelegramSessionState.NEWS_WRITE_TEXT,
  );

  if (!claimed) {
    return;
  }

  const postType = claimed.postType ?? LifeStoryType.ANIMAL_STORY;

  try {
    await publishNewsFromTelegram({
      shelterId: linked.shelter.id,
      authorId: linked.user.id,
      type: postType,
      animalId:
        postType === LifeStoryType.ANIMAL_STORY ? claimed.animalId : null,
      content: trimmed,
      photoFileId: claimed.photoFileId,
    });

    await ctx.reply(MSG.newsPublished, { reply_markup: mainMenuKeyboard() });
  } catch {
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await ctx.reply(MSG.newsFailed, { reply_markup: mainMenuKeyboard() });
  }
}

export function registerVolunteerHandlers(bot: Bot) {
  bot.command("start", async (ctx) => {
    const linked = await getLinkedVolunteer(BigInt(ctx.chat!.id));
    await showMainMenu(ctx, linked?.shelter?.name);
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(MSG.help);
  });

  bot.command("cancel", async (ctx) => {
    const chatId = BigInt(ctx.chat!.id);
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    const linked = await getLinkedVolunteer(chatId);
    await ctx.reply(MSG.cancelled);
    await showMainMenu(ctx, linked?.shelter?.name);
  });

  bot.command("newcat", startNewAnimalFlow);
  bot.command("news", startNewsFlow);

  bot.command("link", async (ctx) => {
    const code = ctx.match?.trim();
    if (!code) {
      await ctx.reply("Використання: /link КОД");
      return;
    }
    await handleLinkCommand(ctx, code);
  });

  bot.callbackQuery(/^access:request$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = BigInt(ctx.chat!.id);
    const linked = await getLinkedVolunteer(chatId);

    if (linked?.shelter) {
      await ctx.reply(MSG.accessAlreadyMember);
      return;
    }

    const pending = await getPendingAccessRequest(chatId);
    if (pending) {
      await ctx.reply(MSG.accessAlreadyPending);
      return;
    }

    const shelter = await getDefaultVolunteerShelter();
    if (!shelter) {
      await ctx.reply("Притулок не налаштовано. Зверніться до адміністратора.");
      return;
    }

    await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
      state: TelegramSessionState.REQUEST_ACCESS_NAME,
      contextData: {},
      shelterId: shelter.id,
    });

    await ctx.reply(MSG.accessAskName);
  });

  bot.callbackQuery(/^access:skip_email$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = BigInt(ctx.chat!.id);
    const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

    if (session.state !== TelegramSessionState.REQUEST_ACCESS_EMAIL) return;

    await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
      contextData: { ...session.context, email: null },
    });

    await submitAccessRequest(ctx);
  });

  bot.callbackQuery(/^access:(approve|reject):/, async (ctx) => {
    const match = ctx.callbackQuery.data.match(/^access:(approve|reject):(.+)$/);
    if (!match) return;

    const [, action, requestId] = match;

    const request = await prisma.volunteerAccessRequest.findUnique({
      where: { id: requestId },
      select: { id: true, shelterId: true, status: true },
    });

    if (!request) {
      await ctx.answerCallbackQuery({ text: "Запит не знайдено", show_alert: true });
      return;
    }

    const admin = await requireShelterAdmin(ctx, request.shelterId);
    if (!admin) return;

    await ctx.answerCallbackQuery();

    if (request.status !== VolunteerAccessRequestStatus.PENDING) {
      await ctx.reply(MSG.accessReviewDone);
      return;
    }

    if (action === "approve") {
      const result = await approveVolunteerAccessRequest(requestId, admin.user.id);

      if (!result.ok) {
        await ctx.reply(MSG.accessReviewDone);
        return;
      }

      try {
        await notifyVolunteerAccessApproved(result.chatId, result.shelterName);
      } catch {
        // best-effort
      }

      await updateTelegramSession(result.chatId, TelegramBotType.VOLUNTEER, {
        state: TelegramSessionState.IDLE,
        contextData: {},
        shelterId: request.shelterId,
      });

      const originalText = ctx.callbackQuery.message?.text ?? "";
      await ctx
        .editMessageText(`${originalText}\n\n✅ Схвалено`, {
          parse_mode: "Markdown",
        })
        .catch(() => {});
      return;
    }

    const result = await rejectVolunteerAccessRequest(requestId, admin.user.id);

    if (!result.ok) {
      await ctx.reply(MSG.accessReviewDone);
      return;
    }

    try {
      await notifyVolunteerAccessRejected(result.chatId);
    } catch {
      // best-effort
    }

    const originalText = ctx.callbackQuery.message?.text ?? "";
    await ctx
      .editMessageText(`${originalText}\n\n❌ Відхилено`, {
        parse_mode: "Markdown",
      })
      .catch(() => {});
  });

  bot.callbackQuery(/^menu:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const action = ctx.callbackQuery.data.split(":")[1];

    switch (action) {
      case "newcat":
        await startNewAnimalFlow(ctx);
        break;
      case "news":
        await startNewsFlow(ctx);
        break;
      case "cats":
        await showMyCats(ctx);
        break;
      case "settings":
        if (await requireVolunteer(ctx)) {
          await ctx.reply(MSG.settingsSoon, {
            reply_markup: mainMenuKeyboard(),
          });
        }
        break;
    }
  });

  bot.callbackQuery(/^news:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const linked = await requireVolunteer(ctx);
    if (!linked) return;

    const chatId = BigInt(ctx.chat!.id);
    const action = ctx.callbackQuery.data.slice("news:".length);

    if (action === "shelter") {
      await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
        state: TelegramSessionState.NEWS_UPLOAD_MEDIA,
        contextData: {
          postType: LifeStoryType.SHELTER_NEWS,
        },
        shelterId: linked.shelter.id,
      });
      await proceedToNewsPhotoStep(ctx, chatId);
      return;
    }

    if (action === "skip_photo") {
      const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
      if (session.state !== TelegramSessionState.NEWS_UPLOAD_MEDIA) return;

      await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
        state: TelegramSessionState.NEWS_WRITE_TEXT,
        contextData: session.context,
      });
      await ctx.reply(MSG.newsWriteText);
      return;
    }

    if (action.startsWith("animal:")) {
      const animalId = action.slice("animal:".length);
      await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
        state: TelegramSessionState.NEWS_UPLOAD_MEDIA,
        contextData: {
          postType: LifeStoryType.ANIMAL_STORY,
          animalId,
        },
        shelterId: linked.shelter.id,
      });
      await proceedToNewsPhotoStep(ctx, chatId);
    }
  });

  bot.on("message:photo", async (ctx) => {
    const chatId = BigInt(ctx.chat!.id);
    const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

    if (session.state === TelegramSessionState.NEW_ANIMAL_PHOTO) {
      await handleNewAnimalPhoto(ctx);
      return;
    }

    if (session.state === TelegramSessionState.NEWS_UPLOAD_MEDIA) {
      await handleNewsPhoto(ctx);
    }
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.photo) return;

    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;

    const chatId = BigInt(ctx.chat!.id);
    const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

    if (session.state === TelegramSessionState.NEW_ANIMAL_NAME) {
      await handleNewAnimalName(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.REQUEST_ACCESS_NAME) {
      const trimmed = text.trim();
      if (trimmed.length < 2 || trimmed.length > 80) {
        await ctx.reply(MSG.accessInvalidName);
        return;
      }

      await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
        state: TelegramSessionState.REQUEST_ACCESS_EMAIL,
        contextData: { fullName: trimmed },
      });

      await ctx.reply(MSG.accessAskEmail, {
        reply_markup: accessSkipEmailKeyboard(),
      });
      return;
    }

    if (session.state === TelegramSessionState.REQUEST_ACCESS_EMAIL) {
      const trimmed = text.trim();
      if (!isValidEmail(trimmed)) {
        await ctx.reply(MSG.accessInvalidEmail, {
          reply_markup: accessSkipEmailKeyboard(),
        });
        return;
      }

      await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
        contextData: { ...session.context, email: trimmed },
      });

      await submitAccessRequest(ctx);
      return;
    }

    if (session.state === TelegramSessionState.NEWS_WRITE_TEXT) {
      await handleNewsText(ctx, text);
    }
  });
}
