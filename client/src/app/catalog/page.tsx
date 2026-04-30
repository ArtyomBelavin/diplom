import { CatalogClient } from "./catalog-client";

type CatalogPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    sort?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialCategory = params?.category || "";
  const initialQuery = params?.q || "";
  const initialSort = params?.sort || "price-asc";

  return (
    <CatalogClient
      key={`${initialCategory}-${initialQuery}-${initialSort}`}
      initialCategory={initialCategory}
      initialQuery={initialQuery}
      initialSort={initialSort}
    />
  );
}
