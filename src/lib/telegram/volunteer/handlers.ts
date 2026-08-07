import { Bot, Context } from "grammy";
import { LifeStoryType, TelegramBotType, TelegramSessionState } from "@prisma/client";
import { getAppUrl } from "@/lib/env";
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
  getTelegramSession,
  resetTelegramSession,
  updateTelegramSession,
} from "@/lib/telegram/session";
import {
  afterAnimalKeyboard,
  linkInstructionsKeyboard,
  mainMenuKeyboard,
  newsAnimalKeyboard,
  newsSkipPhotoKeyboard,
  MSG,
} from "@/lib/telegram/volunteer/messages";

async function showMainMenu(ctx: Context, shelterName?: string) {
  const text = shelterName
    ? MSG.welcomeLinked(shelterName)
    : MSG.welcomeUnlinked(getAppUrl());

  const keyboard = shelterName
    ? mainMenuKeyboard()
    : linkInstructionsKeyboard();

  await ctx.reply(text, {
    parse_mode: "Markdown",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

async function requireVolunteer(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await getLinkedVolunteer(chatId);

  if (!linked?.shelter) {
    const keyboard = linkInstructionsKeyboard();
    await ctx.reply(MSG.needLink(getAppUrl()), {
      ...(keyboard ? { reply_markup: keyboard } : {}),
    });
    return null;
  }

  return linked;
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
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const linked = await requireVolunteer(ctx);

  if (!linked) return;

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    await ctx.reply(MSG.newAnimalInvalidName);
    return;
  }

  const photoFileId = session.context.photoFileId;
  if (!photoFileId) {
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await ctx.reply(MSG.uploadFailed);
    await showMainMenu(ctx, linked.shelter.name);
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

    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);

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
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const linked = await requireVolunteer(ctx);

  if (!linked?.shelter) return;

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 4000) {
    await ctx.reply(MSG.newsInvalidText);
    return;
  }

  const postType = session.context.postType ?? LifeStoryType.ANIMAL_STORY;

  try {
    await publishNewsFromTelegram({
      shelterId: linked.shelter.id,
      authorId: linked.user.id,
      type: postType,
      animalId:
        postType === LifeStoryType.ANIMAL_STORY
          ? session.context.animalId
          : null,
      content: trimmed,
      photoFileId: session.context.photoFileId,
    });

    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
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
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;

    const chatId = BigInt(ctx.chat!.id);
    const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

    if (session.state === TelegramSessionState.NEW_ANIMAL_NAME) {
      await handleNewAnimalName(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.NEWS_WRITE_TEXT) {
      await handleNewsText(ctx, text);
    }
  });
}
