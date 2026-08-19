import { InlineKeyboard } from "grammy";
import { getAppUrl, isPublicHttpsUrl } from "@/lib/env";

export const MSG = {
  welcomeUnlinked:
    "🐾 *KotoXata — Панель волонтера*\n\nНатисніть «Запит доступу», щоб адміністратор схвалив вас.\n\nЯкщо у вас уже є обліковий запис на сайті — використайте `/link КОД` з CRM.",

  welcomePending: (shelterName: string) =>
    `⏳ *Запит надіслано*\n\nОчікуйте схвалення адміністратором притулку *${shelterName}*.`,

  welcomeLinked: (shelterName: string) =>
    `🐾 *KotoXata — Панель волонтера*\nПритулок: *${shelterName}*`,

  linkSuccess: (shelterName: string) =>
    `✅ Акаунт прив'язано!\nПритулок: *${shelterName}*`,

  linkInvalid: "❌ Невірний код. Перевірте та спробуйте ще раз.",
  linkExpired: "⏰ Код прострочено. Отримайте новий у CRM.",
  linkUsed: "⚠️ Цей код уже використано.",
  linkNotMember:
    "❌ Ваш акаунт не має доступу до притулку. Зверніться до адміністратора.",

  needLink:
    "Спочатку запросіть доступ через /start або прив'яжіть акаунт командою /link КОД.",

  accessAskName: "Як вас звати? (ім'я та прізвище)",
  accessInvalidName: "Ім'я має містити від 2 до 80 символів.",
  accessAskEmail:
    "Вкажіть email (необов'язково) — для входу в CRM на сайті.\n\nАбо натисніть «Пропустити».",
  accessInvalidEmail: "Невірний формат email. Спробуйте ще раз або пропустіть.",
  accessSubmitted: (shelterName: string) =>
    `✅ *Запит надіслано!*\n\nАдміністратор *${shelterName}* отримає повідомлення. Очікуйте схвалення.`,
  accessAlreadyPending:
    "⏳ У вас уже є активний запит. Очікуйте рішення адміністратора.",
  accessAlreadyMember: "✅ У вас уже є доступ. Надішліть /start.",
  accessEmailTaken:
    "Цей email уже використовується. Вкажіть інший або пропустіть.",
  accessApproved: (shelterName: string) =>
    `✅ *Доступ схвалено!*\n\nПритулок: *${shelterName}*`,
  accessRejected: "❌ Запит відхилено.",
  accessReviewDone: "Запит опрацьовано.",
  accessNotAdmin: "Лише адміністратор може схваляти запити.",

  newAnimalPhoto: "Надішліть фото нового котика 📷",
  newAnimalName: "Як його/її звати?",
  newAnimalDone: (name: string) =>
    `✅ *${name}* доданий!\nКартку можна доповнити в CRM.`,
  newAnimalInvalidPhoto: "Будь ласка, надішліть *фото* котика 📷",
  newAnimalInvalidName: "Ім'я має містити від 1 до 50 символів.",
  newAnimalDuplicateName: (name: string) =>
    `⚠️ Котик *${name}* уже є в базі.\n\nВведіть інше ім'я.`,

  uploadFailed: "Не вдалось завантажити фото. Спробуйте ще раз.",
  cancelled: "Скасовано. Ось головне меню 👇",
  help: "Команди:\n/start — головне меню\n/newcat — новий котик\n/news — нова публікація\n/cancel — скасувати\n/link КОД — прив'язати існуючий акаунт",

  myCatsEmpty: "Поки немає котиків у притулку.",
  myCatsHeader: "🐈 Останні котики:",

  newsSelectTarget:
    "Про що публікація?\n\n🐈 *Котик з куратором* — новина для кураторів (з'явиться в профілі котика).\n🏠 *Про притулок* — новина для публічної стрічки на сайті.",
  newsNoCuratedCats:
    "Зараз немає котиків з активним куратором. Новину про котика можна додати пізніше.\n\nМожете опублікувати новину *про притулок* 👇",
  newsAnimalNoCurator:
    "У цього котика немає активного куратора. Оберіть іншого або «Про притулок».",
  newsWriteTitle: "Напишіть *заголовок* новини про притулок (до 120 символів):",
  newsInvalidTitle: "Заголовок має містити від 1 до 120 символів.",
  newsUploadPhoto: "Надішліть фото 📷 або натисніть «Пропустити»",
  newsWriteText: "Напишіть текст публікації:",
  newsPublished: "✅ Опубліковано на сайті!",
  newsInvalidText: "Текст має містити від 1 до 4000 символів.",
  newsFailed: "Не вдалося опублікувати. Спробуйте через CRM.",

  curatorsMenu: "👤 *Куратори*",
  curatorsEmpty: "Поки немає кураторів.",
  curatorsListHeader: (total: number) => `📋 *Куратори* (${total})`,
  curatorAddName: "Ім'я куратора (ПІБ):",
  curatorAddEmail: "Email куратора:",
  curatorAddPhone:
    "Телефон куратора (необов'язково).\n\nАбо натисніть «Пропустити».",
  curatorPickAnimal:
    "Натисніть «Пошук котика», потім введіть *ім'я* або *slug* підопічного.",
  curatorAddAmount: (animalName: string, minAmount?: number | null) =>
    minAmount != null
      ? `Сума кураторства для *${animalName}* (₴/міс, мін. ${minAmount}):`
      : `Сума кураторства для *${animalName}* (₴/міс):`,
  curatorInvalidName: "Ім'я має містити від 1 до 100 символів.",
  curatorInvalidEmail: "Невірний формат email.",
  curatorInvalidPhone: "Телефон занадто довгий (до 30 символів).",
  curatorInvalidAmount: "Вкажіть додатну суму в гривнях.",
  curatorAdded: (curatorName: string, animalName: string, amount: number) =>
    `✅ Куратора *${curatorName}* додано до *${animalName}* (${amount} ₴/міс).`,
  curatorReusePrompt: (fullName: string, email: string) =>
    `Нещодавно ви додавали *${fullName}* (${email}).\n\nДодати котика цьому куратору чи ввести дані нового?`,
  curatorPickAnimalFor: (fullName: string) =>
    `Оберіть котика для *${fullName}*.\n\nНатисніть «Пошук котика», потім введіть *ім'я* або *slug* підопічного.`,
  curatorAddFailed: "Не вдалося додати куратора. Спробуйте через CRM.",
  curatorAddIncomplete:
    "Дані куратора втрачено. Почніть додавання знову через меню «Куратори».",
  curatorSessionExpired: "Сесію перервано. Почніть додавання куратора знову.",

  catSearchPrompt: "Введіть *ім'я* або *slug* котика:",
  catSearchEmpty: "Нічого не знайдено. Спробуйте інший запит.",
  catSearchPick: "Оберіть котика з результатів:",
  catSearchResult: (params: {
    name: string;
    slug: string;
    sexLabel: string;
    statusLabel: string;
    hasCurator: boolean;
    description?: string | null;
    minCuratorshipAmount?: number | null;
  }) => {
    const lines = [
      `🐈 *${params.name}*`,
      `slug: \`${params.slug}\``,
      `Стать: ${params.sexLabel}`,
      `Статус: ${params.statusLabel}`,
      `Куратор: ${params.hasCurator ? "так ✅" : "ні"}`,
    ];

    if (params.minCuratorshipAmount != null) {
      lines.push(`Мін. кураторство: ${params.minCuratorshipAmount} ₴/міс`);
    }

    if (params.description?.trim()) {
      const short =
        params.description.trim().length > 220
          ? `${params.description.trim().slice(0, 217)}…`
          : params.description.trim();
      lines.push("", short);
    }

    return lines.join("\n");
  },
  catAlreadyHasCurator: "У цього котика вже є активний куратор.",

  settingsSoon: "⚙️ Налаштування — скоро!",
} as const;

export function navOnlyKeyboard() {
  return new InlineKeyboard()
    .text("◀️ Назад", "nav:back")
    .text("🏠 Головне меню", "nav:home");
}

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("➕ Новий котик", "menu:newcat")
    .text("➕ Новина", "menu:news")
    .row()
    .text("🔍 Пошук котика", "menu:search")
    .text("👤 Куратори", "menu:curators")
    .row()
    .text("🐈 Мої котики", "menu:cats")
    .text("⚙️ Налаштування", "menu:settings");
}

export function curatorsMenuKeyboard(options?: { showAddAnother?: boolean }) {
  const keyboard = new InlineKeyboard()
    .text("➕ Додати куратора", "curator:add")
    .text("📋 Список", "curator:list");

  if (options?.showAddAnother) {
    keyboard.row().text("➕ Котик існуючому", "curator:add_another");
  }

  return keyboard;
}

export function afterCuratorAddedKeyboard() {
  return new InlineKeyboard()
    .text("➕ Ще котик цьому куратору", "curator:add_another")
    .row()
    .text("👤 Куратори", "menu:curators")
    .text("🏠 Головне меню", "nav:home");
}

export function curatorReuseKeyboard() {
  return new InlineKeyboard()
    .text("✅ Цей куратор", "curator:reuse_last")
    .text("➕ Новий куратор", "curator:new");
}

export function afterAnimalKeyboard() {
  return new InlineKeyboard()
    .text("➕ Новина", "menu:news")
    .text("➕ Ще котик", "menu:newcat")
    .row()
    .text("🏠 Меню", "nav:home");
}

export function unlinkedUserKeyboard() {
  return new InlineKeyboard().text("📝 Запит доступу", "access:request");
}

export function accessSkipEmailKeyboard() {
  return new InlineKeyboard()
    .text("Пропустити email", "access:skip_email")
    .row()
    .text("◀️ Назад", "nav:back")
    .text("🏠 Меню", "nav:home");
}

export function curatorSkipPhoneKeyboard() {
  return new InlineKeyboard()
    .text("Пропустити телефон", "curator:skip_phone")
    .row()
    .text("🔍 Пошук котика", "curator:search_animal");
}

export function curatorSearchAnimalKeyboard() {
  return new InlineKeyboard().text("🔍 Пошук котика", "curator:search_animal");
}

export function linkInstructionsKeyboard() {
  const loginUrl = `${getAppUrl()}/uk/staff/login`;
  if (!isPublicHttpsUrl(loginUrl)) {
    return undefined;
  }
  return new InlineKeyboard().url("Увійти на сайт", loginUrl);
}

export function newsAnimalKeyboard(
  animals: Array<{ id: string; name: string }>,
) {
  const keyboard = new InlineKeyboard().text("🏠 Про притулок", "news:shelter");

  for (const animal of animals) {
    keyboard.row().text(animal.name, `news:animal:${animal.id}`);
  }

  return keyboard;
}

export function newsSkipPhotoKeyboard() {
  return new InlineKeyboard().text("Пропустити фото", "news:skip_photo");
}

export function animalPickKeyboard(
  animals: Array<{ id: string; name: string }>,
  prefix: "curator" | "search",
) {
  const keyboard = new InlineKeyboard();

  for (const animal of animals) {
    keyboard.row().text(animal.name, `${prefix}:pick:${animal.id}`);
  }

  return keyboard;
}

export function catSearchDetailKeyboard(animalId: string, hasCurator: boolean) {
  const keyboard = new InlineKeyboard();

  if (!hasCurator) {
    keyboard.text("➕ Додати йому куратора", `search:add_curator:${animalId}`).row();
  }

  keyboard.text("◀️ Назад", "nav:back").text("🏠 Головне меню", "nav:home");
  return keyboard;
}

export function catProfileKeyboard(shelterSlug: string, animalSlug: string) {
  const url = `${getAppUrl()}/uk/s/${shelterSlug}/cats/${animalSlug}`;
  const keyboard = new InlineKeyboard();

  if (isPublicHttpsUrl(url)) {
    keyboard.url("Відкрити на сайті", url);
  }

  return keyboard;
}
