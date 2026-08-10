import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { parseCatalogFilters } from "@/lib/catalog-filters";
import { getCatalogCatsPaginated } from "@/lib/catalog-animals";
import { parsePageParam } from "@/lib/pagination";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shelterSlug: string }> },
) {
  const { shelterSlug } = await params;
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { id: true },
  });

  if (!shelter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const filters = parseCatalogFilters({
    sex: url.searchParams.get("sex") ?? undefined,
    support: url.searchParams.get("support") ?? undefined,
    age: url.searchParams.get("age") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  });
  const page = parsePageParam(url.searchParams.get("page") ?? undefined);

  const result = await getCatalogCatsPaginated(shelter.id, filters, page);

  return NextResponse.json(result);
}
