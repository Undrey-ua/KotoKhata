import type { Context } from "grammy";
import { TelegramBotType, TelegramSessionState } from "@prisma/client";
import { getCrmCuratorshipsListPaginated } from "@/lib/crm/curators-list";
import { listShelterAnimalsWithCurators } from "@/lib/telegram/create-animal";
import { getTelegramSession } from "@/lib/telegram/session";
import { getPendingAccessRequest } from "@/lib/telegram/volunteer-access";
import {
  appendNavRow,
  replyWithNav,
  transitionSession,
} from "@/lib/telegram/volunteer/navigation";
import {
  accessSkipEmailKeyboard,
  curatorSearchAnimalKeyboard,
  curatorSkipPhoneKeyboard,
  curatorsMenuKeyboard,
  MSG,
  mainMenuKeyboard,
  newsAnimalKeyboard,
  newsSkipPhotoKeyboard,
  navOnlyKeyboard,
  unlinkedUserKeyboard,
} from "@/lib/telegram/volunteer/messages";

type LinkedVolunteer = {
  shelter: { id: string; name: string; slug: string };
};

export async function showMainMenu(ctx: Context, shelterName?: string) {
  if (shelterName) {
    await ctx.reply(MSG.welcomeLinked(shelterName), {
      parse_mode: "Markdown",
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const chatId = BigInt(ctx.chat!.id);
  const pending = await getPendingAccessRequest(chatId);

  if (pending) {
    await ctx.reply(MSG.welcomePending(pending.shelter.name), {
      parse_mode: "Markdown",
      reply_markup: navOnlyKeyboard(),
    });
    return;
  }

  await ctx.reply(MSG.welcomeUnlinked, {
    parse_mode: "Markdown",
    reply_markup: unlinkedUserKeyboard(),
  });
}

export async function renderSessionStep(ctx: Context, linked: LinkedVolunteer) {
  const chatId = BigInt(ctx.chat!.id);
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  switch (session.state) {
    case TelegramSessionState.NEW_ANIMAL_PHOTO:
      await replyWithNav(ctx, MSG.newAnimalPhoto);
      return;

    case TelegramSessionState.NEW_ANIMAL_NAME:
      await replyWithNav(ctx, MSG.newAnimalName);
      return;

    case TelegramSessionState.NEWS_SELECT_ANIMAL: {
      const animals = await listShelterAnimalsWithCurators(linked.shelter.id);
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
      return;
    }

    case TelegramSessionState.NEWS_WRITE_TITLE:
      await replyWithNav(ctx, MSG.newsWriteTitle, { parse_mode: "Markdown" });
      return;

    case TelegramSessionState.NEWS_UPLOAD_MEDIA:
      await replyWithNav(ctx, MSG.newsUploadPhoto, {
        reply_markup: newsSkipPhotoKeyboard(),
      });
      return;

    case TelegramSessionState.NEWS_WRITE_TEXT:
      await replyWithNav(ctx, MSG.newsWriteText);
      return;

    case TelegramSessionState.CURATOR_ADD_NAME:
      await replyWithNav(ctx, MSG.curatorAddName);
      return;

    case TelegramSessionState.CURATOR_ADD_EMAIL:
      await replyWithNav(ctx, MSG.curatorAddEmail);
      return;

    case TelegramSessionState.CURATOR_ADD_PHONE:
      await replyWithNav(ctx, MSG.curatorAddPhone, {
        reply_markup: curatorSkipPhoneKeyboard(),
      });
      return;

    case TelegramSessionState.CURATOR_ADD_ANIMAL: {
      const draft = session.context.curatorDraft;
      const prompt =
        draft?.fullName != null
          ? MSG.curatorPickAnimalFor(draft.fullName)
          : MSG.curatorPickAnimal;
      await replyWithNav(ctx, prompt, {
        parse_mode: "Markdown",
        reply_markup: curatorSearchAnimalKeyboard(),
      });
      return;
    }

    case TelegramSessionState.CURATOR_ADD_AMOUNT: {
      const draft = session.context.curatorDraft;
      await replyWithNav(
        ctx,
        MSG.curatorAddAmount(draft?.animalName ?? "котика", null),
        { parse_mode: "Markdown" },
      );
      return;
    }

    case TelegramSessionState.CAT_SEARCH:
      await replyWithNav(ctx, MSG.catSearchPrompt, { parse_mode: "Markdown" });
      return;

    case TelegramSessionState.REQUEST_ACCESS_NAME:
      await replyWithNav(ctx, MSG.accessAskName);
      return;

    case TelegramSessionState.REQUEST_ACCESS_EMAIL:
      await replyWithNav(ctx, MSG.accessAskEmail, {
        reply_markup: accessSkipEmailKeyboard(),
      });
      return;

    case TelegramSessionState.IDLE:
      await showMainMenu(ctx, linked.shelter.name);
      return;

    default:
      await showMainMenu(ctx, linked.shelter.name);
  }
}

export async function showCuratorsMenu(ctx: Context) {
  const chatId = BigInt(ctx.chat!.id);
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);
  const showAddAnother = Boolean(
    session.context.lastCuratorContact?.fullName &&
      session.context.lastCuratorContact.email,
  );

  await ctx.reply(MSG.curatorsMenu, {
    parse_mode: "Markdown",
    reply_markup: appendNavRow(curatorsMenuKeyboard({ showAddAnother })),
  });
}

export async function showCuratorsList(ctx: Context, shelterId: string) {
  const result = await getCrmCuratorshipsListPaginated(shelterId, {
    page: 1,
    pageSize: 20,
  });

  if (!result.items.length) {
    await replyWithNav(ctx, MSG.curatorsEmpty, {
      reply_markup: curatorsMenuKeyboard(),
    });
    return;
  }

  const lines = result.items
    .map(
      (row) =>
        `• ${row.curatorName} — ${row.animalName} (${row.monthlyAmount} ₴/міс)`,
    )
    .join("\n");

  await replyWithNav(
    ctx,
    `${MSG.curatorsListHeader(result.total)}\n\n${lines}`,
    {
      parse_mode: "Markdown",
      reply_markup: curatorsMenuKeyboard(),
    },
  );
}

export async function startCatSearchFlow(
  ctx: Context,
  chatId: bigint,
  shelterId: string,
  flow: "lookup" | "curator",
) {
  const session = await getTelegramSession(chatId, TelegramBotType.VOLUNTEER);

  await transitionSession(chatId, {
    state: TelegramSessionState.CAT_SEARCH,
    contextData: {
      ...session.context,
      catSearchFlow: flow,
    },
    shelterId,
  });

  await replyWithNav(ctx, MSG.catSearchPrompt, { parse_mode: "Markdown" });
}
