"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveVolunteerAccessRequestAction,
  rejectVolunteerAccessRequestAction,
} from "@/actions/volunteer-access-requests";
import type { VolunteerAccessRequestItem } from "@/lib/crm/volunteer-access-requests";

type VolunteerAccessRequestsPanelProps = {
  shelterSlug: string;
  requests: VolunteerAccessRequestItem[];
};

export function VolunteerAccessRequestsPanel({
  shelterSlug,
  requests,
}: VolunteerAccessRequestsPanelProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!requests.length) return null;

  function handleApprove(requestId: string) {
    startTransition(async () => {
      await approveVolunteerAccessRequestAction(shelterSlug, requestId);
      router.refresh();
    });
  }

  function handleReject(requestId: string) {
    if (!confirm("Відхилити цей запит?")) return;
    startTransition(async () => {
      await rejectVolunteerAccessRequestAction(shelterSlug, requestId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 shadow-sm">
      <div className="border-b border-amber-200 px-5 py-4">
        <h2 className="font-semibold text-foreground">Запити з Telegram</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {requests.length} очікує на схвалення
        </p>
      </div>

      <ul className="divide-y divide-amber-200/80">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{request.fullName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.email ?? "Email не вказано"}
                {request.telegramUsername
                  ? ` · @${request.telegramUsername}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(request.createdAt).toLocaleString("uk-UA")}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => handleApprove(request.id)}
              >
                <UserCheck className="mr-1.5 h-4 w-4" />
                Схвалити
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => handleReject(request.id)}
              >
                <UserX className="mr-1.5 h-4 w-4" />
                Відхилити
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
