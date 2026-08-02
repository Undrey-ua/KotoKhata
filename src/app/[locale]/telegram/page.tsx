import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Cat,
  Camera,
  Search,
  ListTodo,
  MessageSquare,
  BarChart3,
  Settings,
  Newspaper,
} from "lucide-react";

export default async function TelegramPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("telegram");

  const menuItems = [
    { icon: Cat, label: t("menu.newAnimal") },
    { icon: Newspaper, label: t("menu.newNews") },
    { icon: Camera, label: t("menu.photo") },
    { icon: Search, label: t("menu.findAnimal") },
    { icon: ListTodo, label: t("menu.tasks") },
    { icon: MessageSquare, label: t("menu.messages") },
    { icon: BarChart3, label: t("menu.stats") },
    { icon: Settings, label: t("menu.settings") },
  ];

  const chat = [
    { from: "bot", text: t("chat.photo") },
    { from: "user", text: t("chat.photoReply") },
    { from: "bot", text: t("chat.name") },
    { from: "user", text: "Мурчик" },
    { from: "bot", text: t("chat.done") },
  ];

  return (
    <div className="section-cool min-h-full">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border-4 border-charcoal bg-charcoal shadow-xl">
              <div className="bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground">
                KotoXata Bot
              </div>
              <div className="space-y-2 bg-background p-4">
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <p
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        msg.from === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border-cool text-foreground"
                      }`}
                    >
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-border-cool bg-card p-3">
                {menuItems.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex flex-col items-center gap-1 rounded-xl border border-border-cool bg-surface-cool/60 px-2 py-3 text-center text-[11px] font-medium text-foreground"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t("previewNote")}</p>
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div className="rounded-2xl border border-border-cool bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">{t("volunteerTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("volunteerDesc")}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• {t("feature1")}</li>
                <li>• {t("feature2")}</li>
                <li>• {t("feature3")}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-cool bg-card p-6 shadow-sm">
              <p className="text-4xl font-bold text-primary">30 {t("seconds")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("speedDesc")}</p>
            </div>
            <Button asChild>
              <Link href="/s/kotoxata/cats">{t("cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
