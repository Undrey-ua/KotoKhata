import { requireTelegramVolunteerToken } from "@/lib/env";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

interface TelegramFileResponse {
  ok: boolean;
  result?: { file_path: string };
}

export async function downloadTelegramPhoto(fileId: string) {
  const token = requireTelegramVolunteerToken();
  const fileRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );
  const fileData = (await fileRes.json()) as TelegramFileResponse;

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error("Failed to resolve Telegram file");
  }

  const filePath = fileData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const res = await fetch(downloadUrl);

  if (!res.ok) {
    throw new Error("Failed to download Telegram file");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "jpg";

  return {
    buffer,
    mimeType: MIME_BY_EXT[ext] ?? "image/jpeg",
  };
}
