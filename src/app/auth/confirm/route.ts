import { type NextRequest } from "next/server";
import { handleAuthRedirect } from "@/lib/auth/handle-auth-redirect";

export async function GET(request: NextRequest) {
  return handleAuthRedirect(request);
}
