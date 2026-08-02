"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateVolunteerLinkCodeAction,
  getVolunteerTelegramStatusAction,
} from "@/actions/telegram-link";

const BOT_USERNAME = "Kotoxata_Volunteer_bot";

type TelegramLinkCardProps = {
  shelterSlug: string;
  initialLinked: boolean;
  initialLinkedAt: string | null;
  initialUsername: string | null;
};

export function TelegramLinkCard({
  shelterSlug,
  initialLinked,
  initialLinkedAt,
  initialUsername,
}: TelegramLinkCardProps) {
  const [linked, setLinked] = useState(initialLinked);
  const [linkedAt, setLinkedAt] = useState(initialLinkedAt);
  const [username, setUsername] = useState(initialUsername);
  const [command, setCommand] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refreshStatus() {
    startTransition(async () => {
      const status = await getVolunteerTelegramStatusAction(shelterSlug);
      setLinked(status.linked);
      setLinkedAt(status.linkedAt);
      setUsername(status.username);
    });
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateVolunteerLinkCodeAction(shelterSlug);
        setCommand(result.command);
        setExpiresAt(result.expiresAt);
      } catch {
        setError("Не вдалось згенерувати код. Спробуйте ще раз.");
      }
    });
  }

  async function handleCopy() {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const linkedDate = linkedAt
    ? new Date(linkedAt).toLocaleString("uk-UA", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const expiryDate = expiresAt
    ? new Date(expiresAt).toLocaleString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground">Telegram-бот</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            @{BOT_USERNAME} — додавайте котиків і новини з телефону
          </p>
        </div>
      </div>

      {linked ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-900">
            ✅ Telegram прив&apos;язано
            {username ? ` (@${username})` : ""}
          </p>
          {linkedDate && (
            <p className="mt-0.5 text-xs text-emerald-700">{linkedDate}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={pending}
            onClick={refreshStatus}
          >
            {pending ? "…" : "Оновити статус"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            <li>1. Натисніть «Отримати код»</li>
            <li>
              2. Відкрийте{" "}
              <a
                href={`https://t.me/${BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                @{BOT_USERNAME}
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>3. Надішліть боту отриману команду</li>
          </ol>

          {!command ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={handleGenerate}
            >
              {pending ? "…" : "Отримати код"}
            </Button>
          ) : (
            <div className="rounded-lg border border-border-cool bg-surface-cool/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Команда для бота
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="break-all rounded bg-background px-3 py-2 font-mono text-xs text-foreground sm:flex-1 sm:text-sm">
                  {command}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  aria-label="Копіювати"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {expiryDate && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Дійсний до {expiryDate}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 px-0 text-muted-foreground"
                disabled={pending}
                onClick={handleGenerate}
              >
                {pending ? "…" : "Новий код"}
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
