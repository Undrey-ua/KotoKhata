import { PrismaClient } from "@prisma/client";
import { getDatabaseHostForLog, getDatabaseUrl } from "../src/lib/db/database-url";

async function main() {
  const url = getDatabaseUrl();
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log(`✓ Database OK (${getDatabaseHostForLog()})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗ Database connection failed");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
