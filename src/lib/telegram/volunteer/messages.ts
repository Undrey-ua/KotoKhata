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
    `⚠️ Котик *${name}* уже є в базі.\n\nВведіть інше ім'я або /cancel для скасування.`,

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

  settingsSoon: "⚙️ Налаштування — скоро!",
} as const;

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("➕ Новий котик", "menu:newcat")
    .row()
    .text("➕ Новина", "menu:news")
    .row()
    .text("🐈 Мої котики", "menu:cats")
    .row()
    .text("⚙️ Налаштування", "menu:settings");
}

export function afterAnimalKeyboard() {
  return new InlineKeyboard()
    .text("➕ Новина", "menu:news")
    .row()
    .text("➕ Ще котик", "menu:newcat");
}

export function unlinkedUserKeyboard() {
  return new InlineKeyboard().text("📝 Запит доступу", "access:request");
}

export function accessSkipEmailKeyboard() {
  return new InlineKeyboard().text("Пропустити email", "access:skip_email");
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
