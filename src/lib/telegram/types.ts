import type { LifeStoryType, TelegramSessionState } from "@prisma/client";

export type NavFrame = {
  state: TelegramSessionState;
  context: VolunteerSessionContext;
};

export type CuratorContact = {
  fullName: string;
  email: string;
  phone?: string | null;
};

export type CuratorDraft = {
  fullName?: string;
  email?: string;
  phone?: string | null;
  animalId?: string;
  animalName?: string;
};

export type CatSearchFlow = "lookup" | "curator" | "curator_pick";

export type CuratorAddMode = "choice" | "new";

export interface VolunteerSessionContext {
  photoFileId?: string;
  photoMimeType?: string;
  animalId?: string;
  postType?: LifeStoryType;
  draftText?: string;
  title?: string;
  fullName?: string;
  email?: string | null;
  navStack?: NavFrame[];
  curatorDraft?: CuratorDraft;
  lastCuratorContact?: CuratorContact;
  curatorAddMode?: CuratorAddMode;
  catSearchFlow?: CatSearchFlow;
  lastHandledMessageId?: number;
}

export type SessionUpdate = {
  state?: TelegramSessionState;
  contextData?: VolunteerSessionContext;
  shelterId?: string | null;
};

export function frameContext(
  context: VolunteerSessionContext,
): VolunteerSessionContext {
  const { navStack: _navStack, ...rest } = context;
  return rest;
}
