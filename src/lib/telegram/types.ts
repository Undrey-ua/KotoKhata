import type { TelegramSessionState } from "@prisma/client";

export interface VolunteerSessionContext {
  photoFileId?: string;
  photoMimeType?: string;
  animalId?: string;
  draftText?: string;
}

export type SessionUpdate = {
  state?: TelegramSessionState;
  contextData?: VolunteerSessionContext;
  shelterId?: string | null;
};
