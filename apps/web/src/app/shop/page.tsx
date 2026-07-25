import { redirect } from "next/navigation";

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

// /shop is kept as a redirect to /products for old links/bookmarks — the
// listing page itself now lives at /products to match the site's sitemap.
export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const suffix = query.toString();
  redirect(suffix ? `/products?${suffix}` : "/products");
}
