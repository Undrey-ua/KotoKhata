import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";
import { updateSession } from "./src/lib/auth/supabase-middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Supabase email links may land on Site URL with ?code= — forward to callback
  if (
    pathname !== "/auth/callback" &&
    (searchParams.has("code") || searchParams.has("token_hash"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    "/",
    "/(uk|en)/:path*",
    "/((?!api|auth|_next|_vercel|.*\\..*).*)",
  ],
};
