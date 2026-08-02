/**
 * Runtime Prisma URL for the app.
 *
 * - Default: DATABASE_URL (Supabase transaction pooler, port 6543)
 * - Fallback: DIRECT_URL (session pooler, port 5432)
 * - Override: PRISMA_DATABASE_URL in .env
 *
 * DIRECT_URL in schema.prisma is for `prisma migrate` only.
 */
function appendParam(url: string, key: string, value: string) {
  const sep = url.includes("?") ? "&" : "?";
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  return `${url}${sep}${key}=${value}`;
}

function normalizeDatabaseUrl(raw: string) {
  let url = raw.trim();
  url = appendParam(url, "sslmode", "require");
  url = appendParam(url, "connect_timeout", "30");
  if (url.includes(":6543/")) {
    url = appendParam(url, "pgbouncer", "true");
    url = appendParam(url, "connection_limit", "1");
    url = appendParam(url, "pool_timeout", "20");
  }
  return url;
}

export function getDatabaseUrl() {
  const raw =
    process.env.PRISMA_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.DIRECT_URL;

  if (!raw) {
    throw new Error(
      "Missing DATABASE_URL. Copy connection strings from Supabase Dashboard → Database → Connect.",
    );
  }

  return normalizeDatabaseUrl(raw);
}

/** Safe host:port for dev logs (no credentials). */
export function getDatabaseHostForLog() {
  try {
    const u = new URL(getDatabaseUrl().replace(/^postgresql:/, "http:"));
    return `${u.hostname}:${u.port || "5432"}`;
  } catch {
    return "unknown";
  }
}
