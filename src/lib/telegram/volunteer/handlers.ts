import { Bot, Context } from "grammy";
import {
  LifeStoryType,
  ShelterMemberRole,
  TelegramBotType,
  TelegramSessionState,
  VolunteerAccessRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCrmStatusLabel, sexLabels } from "@/lib/animal-labels";
import { createCuratorFromTelegram } from "@/lib/telegram/create-curator";
import {
  createAnimalFromTelegram,
  findLivingShelterAnimalByName,
  listShelterAnimals,
  listShelterAnimalsWithCurators,
  shelterAnimalHasActiveCurator,
} from "@/lib/telegram/create-animal";
import { publishNewsFromTelegram } from "@/lib/telegram/create-life-story";
import { downloadTelegramPhoto } from "@/lib/telegram/download";
import {
  getLinkedVolunteer,
  redeemTelegramLinkCode,
} from "@/lib/telegram/link";
import {
  getShelterAnimalProfileForTelegram,
  searchShelterAnimalsByQuery,
} from "@/lib/telegram/search-animal";
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
  goHome,
  popNavFrame,
  replyWithNav,
  transitionSession,
} from "@/lib/telegram/volunteer/navigation";
import {
  accessSkipEmailKeyboard,
  afterAnimalKeyboard,
  animalPickKeyboard,
  catSearchDetailKeyboard,
  curatorSearchAnimalKeyboard,
  curatorSkipPhoneKeyboard,
  MSG,
  mainMenuKeyboard,
  newsAnimalKeyboard,
  newsSkipPhotoKeyboard,
  unlinkedUserKeyboard,
} from "@/lib/telegram/volunteer/messages";
import {
  renderSessionStep,
  showCuratorsList,
  showCuratorsMenu,
  showMainMenu,
  startCatSearchFlow,
} from "@/lib/telegram/volunteer/step-render";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

async function handleNavHome(ctx: Context) {
  const chatId = await goHome(ctx);
  const linked = await getLinkedVolunteer(chatId);
  await showMainMenu(ctx, linked?.shelter?.name);
}

async function handleNavBack(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await getLinkedVolunteer(chatId);
  const frame = await popNavFrame(chatId);

  if (!frame) {
    await handleNavHome(ctx);
    return;
  }

  if (linked?.shelter) {
    await renderSessionStep(ctx, linked);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  if (
    session.state === TelegramSessionState.REQUEST_ACCESS_NAME ||
    session.state === TelegramSessionState.REQUEST_ACCESS_EMAIL
  ) {
    await renderSessionStep(ctx, {
      shelter: { id: session.shelterId!, name: "", slug: "" },
    });
    return;
  }

  await showMainMenu(ctx);
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

async function proceedAfterCuratorContact(ctx: Context, chatId: bigint) {
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  if (session.context.curatorDraft?.animalId) {
    const animal = await getShelterAnimalProfileForTelegram(
      session.shelterId!,
      session.context.curatorDraft.animalId,
    );

    await transitionSession(chatId, {
      state: TelegramSessionState.CURATOR_ADD_AMOUNT,
      contextData: session.context,
      shelterId: session.shelterId,
    });

    await replyWithNav(
      ctx,
      MSG.curatorAddAmount(
        animal?.name ?? session.context.curatorDraft.animalName ?? "котика",
        animal?.minCuratorshipAmount,
      ),
      { parse_mode: "Markdown" },
    );
    return;
  }

  await proceedToCuratorPickAnimal(ctx, chatId);
}

async function startCuratorAddForAnimal(
  ctx: Context,
  linked: NonNullable<Awaited<ReturnType<typeof requireVolunteer>>>,
  animalId: string,
) {
  const animal = await getShelterAnimalProfileForTelegram(
    linked.shelter.id,
    animalId,
  );

  if (!animal) {
    await replyWithNav(ctx, MSG.catSearchEmpty);
    return;
  }

  if (animal.hasCurator) {
    await replyWithNav(ctx, MSG.catAlreadyHasCurator);
    return;
  }

  const chatId = BigInt(ctx.chat!.id);
  await transitionSession(chatId, {
    state: TelegramSessionState.CURATOR_ADD_NAME,
    contextData: {
      curatorDraft: {
        animalId: animal.id,
        animalName: animal.name,
      },
    },
    shelterId: linked.shelter.id,
  });

  await replyWithNav(ctx, MSG.curatorAddName);
}

async function proceedToCuratorPickAnimal(ctx: Context, chatId: bigint) {
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  await transitionSession(chatId, {
    state: TelegramSessionState.CURATOR_ADD_ANIMAL,
    contextData: session.context,
    shelterId: session.shelterId,
  });

  await replyWithNav(ctx, MSG.curatorPickAnimal, {
    parse_mode: "Markdown",
    reply_markup: curatorSearchAnimalKeyboard(),
  });
}

async function startNewAnimalFlow(ctx: Context) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const chatId = BigInt(ctx.chat!.id);
  await transitionSession(chatId, {
    state: TelegramSessionState.NEW_ANIMAL_PHOTO,
    contextData: {},
    shelterId: linked.shelter.id,
  });

  await replyWithNav(ctx, MSG.newAnimalPhoto);
}

async function handleNewAnimalPhoto(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const photos = ctx.message?.photo;

  if (!photos?.length) {
    await replyWithNav(ctx, MSG.newAnimalInvalidPhoto, { parse_mode: "Markdown" });
    return;
  }

  const largest = photos[photos.length - 1];
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  await transitionSession(chatId, {
    state: TelegramSessionState.NEW_ANIMAL_NAME,
    contextData: {
      ...session.context,
      photoFileId: largest.file_id,
    },
    shelterId: session.shelterId,
  });

  await replyWithNav(ctx, MSG.newAnimalName);
}

async function handleNewAnimalName(ctx: Context, name: string) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await requireVolunteer(ctx);

  if (!linked) return;

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    await replyWithNav(ctx, MSG.newAnimalInvalidName);
    return;
  }

  const existing = await findLivingShelterAnimalByName(
    linked.shelter.id,
    trimmed,
  );
  if (existing) {
    await replyWithNav(ctx, MSG.newAnimalDuplicateName(existing.name), {
      parse_mode: "Markdown",
    });
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
    await replyWithNav(ctx, MSG.uploadFailed);
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
    await replyWithNav(ctx, MSG.myCatsEmpty, {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const lines = animals.map((a) => `• ${a.name}`).join("\n");
  await replyWithNav(ctx, `${MSG.myCatsHeader}\n\n${lines}`, {
    reply_markup: mainMenuKeyboard(),
  });
}

async function startNewsFlow(ctx: Context) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const chatId = BigInt(ctx.chat!.id);
  const animals = await listShelterAnimalsWithCurators(linked.shelter.id);

  await transitionSession(chatId, {
    state: TelegramSessionState.NEWS_SELECT_ANIMAL,
    contextData: {},
    shelterId: linked.shelter.id,
  });

  if (!animals.length) {
    await replyWithNav(ctx, MSG.newsNoCuratedCats, {
      parse_mode: "Markdown",
      reply_markup: newsAnimalKeyboard([]),
    });
    return;
  }

  await replyWithNav(ctx, MSG.newsSelectTarget, {
    parse_mode: "Markdown",
    reply_markup: newsAnimalKeyboard(animals),
  });
}

async function proceedToNewsPhotoStep(ctx: Context, chatId: bigint) {
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  await transitionSession(chatId, {
    state: TelegramSessionState.NEWS_UPLOAD_MEDIA,
    contextData: session.context,
    shelterId: session.shelterId,
  });

  await replyWithNav(ctx, MSG.newsUploadPhoto, {
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

  await transitionSession(chatId, {
    state: TelegramSessionState.NEWS_WRITE_TEXT,
    contextData: {
      ...session.context,
      photoFileId: largest.file_id,
    },
    shelterId: session.shelterId,
  });

  await replyWithNav(ctx, MSG.newsWriteText);
}

async function handleNewsTitle(ctx: Context, title: string) {
  const chatId = BigInt(ctx.chat!.id);
  const trimmed = title.trim();

  if (!trimmed || trimmed.length > 120) {
    await replyWithNav(ctx, MSG.newsInvalidTitle);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  if (session.state !== TelegramSessionState.NEWS_WRITE_TITLE) return;

  await transitionSession(chatId, {
    state: TelegramSessionState.NEWS_UPLOAD_MEDIA,
    contextData: {
      ...session.context,
      title: trimmed,
    },
    shelterId: session.shelterId,
  });

  await proceedToNewsPhotoStep(ctx, chatId);
}

async function handleNewsText(ctx: Context, text: string) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await requireVolunteer(ctx);

  if (!linked?.shelter) return;

  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 4000) {
    await replyWithNav(ctx, MSG.newsInvalidText);
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
      title: postType === LifeStoryType.SHELTER_NEWS ? claimed.title : null,
      content: trimmed,
      photoFileId: claimed.photoFileId,
    });

    await ctx.reply(MSG.newsPublished, { reply_markup: mainMenuKeyboard() });
  } catch {
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await ctx.reply(MSG.newsFailed, { reply_markup: mainMenuKeyboard() });
  }
}

async function startCuratorAddFlow(ctx: Context) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const chatId = BigInt(ctx.chat!.id);
  await transitionSession(chatId, {
    state: TelegramSessionState.CURATOR_ADD_NAME,
    contextData: { curatorDraft: {} },
    shelterId: linked.shelter.id,
  });

  await replyWithNav(ctx, MSG.curatorAddName);
}

async function handleCuratorName(ctx: Context, text: string) {
  const chatId = BigInt(ctx.chat!.id);
  const trimmed = text.trim();

  if (!trimmed || trimmed.length > 100) {
    await replyWithNav(ctx, MSG.curatorInvalidName);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  await transitionSession(chatId, {
    state: TelegramSessionState.CURATOR_ADD_EMAIL,
    contextData: {
      ...session.context,
      curatorDraft: { ...session.context.curatorDraft, fullName: trimmed },
    },
    shelterId: session.shelterId,
  });

  await replyWithNav(ctx, MSG.curatorAddEmail);
}

async function handleCuratorEmail(ctx: Context, text: string) {
  const chatId = BigInt(ctx.chat!.id);
  const trimmed = text.trim();

  if (!isValidEmail(trimmed)) {
    await replyWithNav(ctx, MSG.curatorInvalidEmail);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  await transitionSession(chatId, {
    state: TelegramSessionState.CURATOR_ADD_PHONE,
    contextData: {
      ...session.context,
      curatorDraft: { ...session.context.curatorDraft, email: trimmed },
    },
    shelterId: session.shelterId,
  });

  await replyWithNav(ctx, MSG.curatorAddPhone, {
    reply_markup: curatorSkipPhoneKeyboard(),
  });
}

async function handleCuratorPhone(ctx: Context, text: string) {
  const chatId = BigInt(ctx.chat!.id);
  const trimmed = text.trim();

  if (trimmed.length > 30) {
    await replyWithNav(ctx, MSG.curatorInvalidPhone);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
    contextData: {
      ...session.context,
      curatorDraft: { ...session.context.curatorDraft, phone: trimmed },
    },
  });

  await proceedAfterCuratorContact(ctx, chatId);
}

function parseMonthlyAmount(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const value = Number.parseFloat(match[1]!);
  if (!Number.isFinite(value) || value <= 0) return null;

  return Math.round(value);
}

async function handleCuratorAmount(ctx: Context, text: string) {
  const chatId = BigInt(ctx.chat!.id);
  const linked = await requireVolunteer(ctx);
  if (!linked?.shelter) return;

  const amount = parseMonthlyAmount(text);
  if (amount == null) {
    await replyWithNav(ctx, MSG.curatorInvalidAmount);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  if (session.state !== TelegramSessionState.CURATOR_ADD_AMOUNT) {
    return;
  }

  const draft = session.context.curatorDraft;
  if (!draft?.fullName || !draft.email || !draft.animalId) {
    await resetTelegramSession(chatId, TelegramBotType.VOLUNTEER);
    await replyWithNav(ctx, MSG.curatorAddIncomplete, {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const claimed = await claimTelegramSessionState(
    chatId,
    TelegramBotType.VOLUNTEER,
    TelegramSessionState.CURATOR_ADD_AMOUNT,
  );

  if (!claimed) {
    await replyWithNav(ctx, MSG.curatorSessionExpired, {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const claimedDraft = claimed.curatorDraft ?? draft;

  try {
    const result = await createCuratorFromTelegram({
      shelterId: linked.shelter.id,
      fullName: claimedDraft.fullName!,
      email: claimedDraft.email!,
      phone: claimedDraft.phone,
      animalId: claimedDraft.animalId!,
      monthlyAmount: amount,
    });

    await ctx.reply(
      MSG.curatorAdded(
        result.curatorName,
        result.animalName,
        result.monthlyAmount,
      ),
      { reply_markup: mainMenuKeyboard() },
    );
  } catch (error) {
    await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
      state: TelegramSessionState.CURATOR_ADD_AMOUNT,
      contextData: claimed,
      shelterId: linked.shelter.id,
    });

    const message =
      error instanceof Error ? error.message : MSG.curatorAddFailed;
    await replyWithNav(ctx, message);
  }
}

async function assignCuratorAnimal(
  ctx: Context,
  linked: NonNullable<Awaited<ReturnType<typeof requireVolunteer>>>,
  animalId: string,
) {
  const chatId = BigInt(ctx.chat!.id);
  const animal = await getShelterAnimalProfileForTelegram(
    linked.shelter.id,
    animalId,
  );

  if (!animal) {
    await replyWithNav(ctx, MSG.catSearchEmpty);
    return;
  }

  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  await transitionSession(chatId, {
    state: TelegramSessionState.CURATOR_ADD_AMOUNT,
    contextData: {
      ...session.context,
      curatorDraft: {
        ...session.context.curatorDraft,
        animalId: animal.id,
        animalName: animal.name,
      },
    },
    shelterId: linked.shelter.id,
  });

  await replyWithNav(
    ctx,
    MSG.curatorAddAmount(animal.name, animal.minCuratorshipAmount),
    { parse_mode: "Markdown" },
  );
}

async function handleCatSearchQuery(ctx: Context, query: string) {
  const linked = await requireVolunteer(ctx);
  if (!linked) return;

  const chatId = BigInt(ctx.chat!.id);
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  if (session.state !== TelegramSessionState.CAT_SEARCH) {
    return;
  }

  const messageId = ctx.message?.message_id;
  if (
    messageId != null &&
    session.context.lastHandledMessageId === messageId
  ) {
    return;
  }

  if (messageId != null) {
    await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
      contextData: {
        ...session.context,
        lastHandledMessageId: messageId,
      },
    });
  }

  const hits = await searchShelterAnimalsByQuery(linked.shelter.id, query);

  if (!hits.length) {
    await replyWithNav(ctx, MSG.catSearchEmpty);
    return;
  }

  const flow = session.context.catSearchFlow ?? "lookup";

  if (flow === "curator" && hits.length === 1) {
    await assignCuratorAnimal(ctx, linked, hits[0]!.id);
    return;
  }

  if (flow === "lookup" && hits.length === 1) {
    await showCatSearchResult(ctx, linked, hits[0]!.id);
    return;
  }

  const prefix = flow === "curator" ? "curator" : "search";

  await replyWithNav(ctx, MSG.catSearchPick, {
    reply_markup: animalPickKeyboard(
      hits.map((hit) => ({ id: hit.id, name: hit.name })),
      prefix,
    ),
  });
}

async function showCatSearchResult(
  ctx: Context,
  linked: NonNullable<Awaited<ReturnType<typeof requireVolunteer>>>,
  animalId: string,
) {
  const animal = await getShelterAnimalProfileForTelegram(
    linked.shelter.id,
    animalId,
  );
  if (!animal) {
    await replyWithNav(ctx, MSG.catSearchEmpty);
    return;
  }

  const caption = MSG.catSearchResult({
    name: animal.name,
    slug: animal.slug,
    sexLabel: sexLabels[animal.sex],
    statusLabel: getCrmStatusLabel(animal.status),
    hasCurator: animal.hasCurator,
    description: animal.description,
    minCuratorshipAmount: animal.minCuratorshipAmount,
  });

  const keyboard = catSearchDetailKeyboard(animal.id, animal.hasCurator);

  if (animal.coverPhotoUrl) {
    await ctx.replyWithPhoto(animal.coverPhotoUrl, {
      caption,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
    return;
  }

  await ctx.reply(caption, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
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
    await goHome(ctx);
    const linked = await getLinkedVolunteer(BigInt(ctx.chat!.id));
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

  bot.callbackQuery(/^nav:(home|back)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery.data === "nav:home") {
      await handleNavHome(ctx);
      return;
    }
    await handleNavBack(ctx);
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

    await transitionSession(chatId, {
      state: TelegramSessionState.REQUEST_ACCESS_NAME,
      contextData: {},
      shelterId: shelter.id,
    });

    await replyWithNav(ctx, MSG.accessAskName);
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
      case "search": {
        const linked = await requireVolunteer(ctx);
        if (!linked) return;
        await startCatSearchFlow(
          ctx,
          BigInt(ctx.chat!.id),
          linked.shelter.id,
          "lookup",
        );
        break;
      }
      case "curators":
        if (await requireVolunteer(ctx)) {
          await showCuratorsMenu(ctx);
        }
        break;
      case "settings":
        if (await requireVolunteer(ctx)) {
          await replyWithNav(ctx, MSG.settingsSoon, {
            reply_markup: mainMenuKeyboard(),
          });
        }
        break;
    }
  });

  bot.callbackQuery(/^curator:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const linked = await requireVolunteer(ctx);
    if (!linked) return;

    const chatId = BigInt(ctx.chat!.id);
    const action = ctx.callbackQuery.data.slice("curator:".length);

    if (action === "add") {
      await startCuratorAddFlow(ctx);
      return;
    }

    if (action === "list") {
      await showCuratorsList(ctx, linked.shelter.id);
      return;
    }

    if (action === "skip_phone") {
      const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
      if (session.state !== TelegramSessionState.CURATOR_ADD_PHONE) return;

      await updateTelegramSession(chatId, TelegramBotType.VOLUNTEER, {
        contextData: {
          ...session.context,
          curatorDraft: { ...session.context.curatorDraft, phone: null },
        },
      });

      await proceedAfterCuratorContact(ctx, chatId);
      return;
    }

    if (action === "search_animal") {
      await startCatSearchFlow(ctx, chatId, linked.shelter.id, "curator");
      return;
    }

    if (action.startsWith("pick:")) {
      const animalId = action.slice("pick:".length);
      await assignCuratorAnimal(ctx, linked, animalId);
    }
  });

  bot.callbackQuery(/^search:(pick|add_curator):/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const linked = await requireVolunteer(ctx);
    if (!linked) return;

    const [, action, animalId] = ctx.callbackQuery.data.match(
      /^search:(pick|add_curator):(.+)$/,
    ) ?? [null, null, null];

    if (!action || !animalId) return;

    if (action === "add_curator") {
      await startCuratorAddForAnimal(ctx, linked, animalId);
      return;
    }

    await showCatSearchResult(ctx, linked, animalId);
  });

  bot.callbackQuery(/^news:/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const linked = await requireVolunteer(ctx);
    if (!linked) return;

    const chatId = BigInt(ctx.chat!.id);
    const action = ctx.callbackQuery.data.slice("news:".length);

    if (action === "shelter") {
      await transitionSession(chatId, {
        state: TelegramSessionState.NEWS_WRITE_TITLE,
        contextData: {
          postType: LifeStoryType.SHELTER_NEWS,
        },
        shelterId: linked.shelter.id,
      });
      await replyWithNav(ctx, MSG.newsWriteTitle, { parse_mode: "Markdown" });
      return;
    }

    if (action === "skip_photo") {
      const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
      if (session.state !== TelegramSessionState.NEWS_UPLOAD_MEDIA) return;

      await transitionSession(chatId, {
        state: TelegramSessionState.NEWS_WRITE_TEXT,
        contextData: session.context,
        shelterId: session.shelterId,
      });
      await replyWithNav(ctx, MSG.newsWriteText);
      return;
    }

    if (action.startsWith("animal:")) {
      const animalId = action.slice("animal:".length);
      const hasCurator = await shelterAnimalHasActiveCurator(
        linked.shelter.id,
        animalId,
      );

      if (!hasCurator) {
        await replyWithNav(ctx, MSG.newsAnimalNoCurator, { parse_mode: "Markdown" });
        return;
      }

      await transitionSession(chatId, {
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
        await replyWithNav(ctx, MSG.accessInvalidName);
        return;
      }

      await transitionSession(chatId, {
        state: TelegramSessionState.REQUEST_ACCESS_EMAIL,
        contextData: { fullName: trimmed },
        shelterId: session.shelterId,
      });

      await replyWithNav(ctx, MSG.accessAskEmail, {
        reply_markup: accessSkipEmailKeyboard(),
      });
      return;
    }

    if (session.state === TelegramSessionState.REQUEST_ACCESS_EMAIL) {
      const trimmed = text.trim();
      if (!isValidEmail(trimmed)) {
        await replyWithNav(ctx, MSG.accessInvalidEmail, {
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

    if (session.state === TelegramSessionState.NEWS_WRITE_TITLE) {
      await handleNewsTitle(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.NEWS_WRITE_TEXT) {
      await handleNewsText(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.CURATOR_ADD_NAME) {
      await handleCuratorName(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.CURATOR_ADD_EMAIL) {
      await handleCuratorEmail(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.CURATOR_ADD_PHONE) {
      await handleCuratorPhone(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.CURATOR_ADD_AMOUNT) {
      await handleCuratorAmount(ctx, text);
      return;
    }

    if (session.state === TelegramSessionState.CAT_SEARCH) {
      await handleCatSearchQuery(ctx, text);
    }
  });
}
