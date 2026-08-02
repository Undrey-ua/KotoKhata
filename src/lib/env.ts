function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function isPublicHttpsUrl(url: string) {
  return url.startsWith("https://");
}

export function getTelegramVolunteerConfig() {
  return {
    token: optional("TELEGRAM_VOLUNTEER_BOT_TOKEN"),
    webhookSecret: optional("TELEGRAM_VOLUNTEER_WEBHOOK_SECRET"),
  };
}

export function requireTelegramVolunteerToken() {
  return required("TELEGRAM_VOLUNTEER_BOT_TOKEN");
}
