import type { LifeStoryType, TelegramSessionState } from "@prisma/client";

export interface VolunteerSessionContext {
  photoFileId?: string;
  photoMimeType?: string;
  animalId?: string;
  postType?: LifeStoryType;
  draftText?: string;
  title?: string;
}

export type SessionUpdate = {
  state?: TelegramSessionState;
  contextData?: VolunteerSessionContext;
  shelterId?: string | null;
};
