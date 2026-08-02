import { InlineKeyboard } from "grammy";
import { getAppUrl, isPublicHttpsUrl } from "@/lib/env";

export const MSG = {
  welcomeUnlinked: (appUrl: string) =>
    `🐾 *KotoXata — Панель волонтера*\n\nПрив'яжіть акаунт, щоб додавати котиків і публікувати новини.\n\n1️⃣ Увійдіть на сайт: ${appUrl}/uk/staff/login\n2️⃣ Отримайте код прив'язки в CRM\n3️⃣ Надішліть боту: \`/link КОД\``,

  welcomeLinked: (shelterName: string) =>
    `🐾 *KotoXata — Панель волонтера*\nПритулок: *${shelterName}*`,

  linkSuccess: (shelterName: string) =>
    `✅ Акаунт прив'язано!\nПритулок: *${shelterName}*`,

  linkInvalid: "❌ Невірний код. Перевірте та спробуйте ще раз.",
  linkExpired: "⏰ Код прострочено. Отримайте новий у CRM.",
  linkUsed: "⚠️ Цей код уже використано.",
  linkNotMember:
    "❌ Ваш акаунт не має доступу до притулку. Зверніться до адміністратора.",

  needLink: (appUrl: string) =>
    `Спочатку прив'яжіть акаунт.\n\n${appUrl}/uk/staff/login`,

  newAnimalPhoto: "Надішліть фото нового котика 📷",
  newAnimalName: "Як його/її звати?",
  newAnimalDone: (name: string) =>
    `✅ *${name}* доданий!\nКартку можна доповнити в CRM.`,
  newAnimalInvalidPhoto: "Будь ласка, надішліть *фото* котика 📷",
  newAnimalInvalidName: "Ім'я має містити від 1 до 50 символів.",

  uploadFailed: "Не вдалось завантажити фото. Спробуйте ще раз.",
  cancelled: "Скасовано. Ось головне меню 👇",
  help: "Команди:\n/start — головне меню\n/newcat — новий котик\n/cancel — скасувати\n/link КОД — прив'язати акаунт",

  myCatsEmpty: "Поки немає котиків у притулку.",
  myCatsHeader: "🐈 Останні котики:",
  newsSoon: "📰 Новини — скоро! Поки що додавайте через CRM.",
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

export function linkInstructionsKeyboard() {
  const loginUrl = `${getAppUrl()}/uk/staff/login`;
  if (!isPublicHttpsUrl(loginUrl)) {
    return undefined;
  }
  return new InlineKeyboard().url("Увійти на сайт", loginUrl);
}
