import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Rating } from "@/components/ui/Rating";
import { serverApiRequest } from "@/lib/server-api";
import { ImageGallery } from "@/app/products/[slug]/ImageGallery";
import { AddToCartPanel } from "@/app/products/[slug]/AddToCartPanel";
import type { ProductDetail } from "@/types/product";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const result = await serverApiRequest<{ product: ProductDetail }>(`/products/${slug}`, {
    tags: [`product:${slug}`],
  });
  return result?.product ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.primaryImage ? [product.primaryImage.url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.sku,
    image: product.images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.basePrice,
      availability: product.variants.some((v) => v.stockQuantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.avgRating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };

  return (
    <Container className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/shop" className="hover:text-ink-900 dark:hover:text-neutral-100">
          Shop
        </Link>{" "}
        /{" "}
        <Link href={`/shop/${product.category.slug}`} className="hover:text-ink-900 dark:hover:text-neutral-100">
          {product.category.name}
        </Link>{" "}
        / <span className="text-ink-900 dark:text-neutral-100">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            {product.brand}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50 sm:text-3xl">
            {product.name}
          </h1>
          <div className="mt-2">
            <Rating value={Number(product.avgRating)} count={product.reviewCount} />
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
            <AddToCartPanel product={product} />
          </div>

          <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-surface-800">
            <h2 className="text-sm font-semibold text-ink-900 dark:text-neutral-100">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
              {product.description}
            </p>
          </div>

          {product.attributes.length > 0 && (
            <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-surface-800">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-neutral-100">Specifications</h2>
              <dl className="mt-3 divide-y divide-neutral-100 text-sm dark:divide-surface-800">
                {product.attributes.map((attr) => (
                  <div key={attr.attributeName} className="flex justify-between py-2">
                    <dt className="text-neutral-500 dark:text-neutral-400">{attr.attributeName}</dt>
                    <dd className="text-ink-900 dark:text-neutral-100">{attr.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6 border-t border-neutral-200 pt-6 text-sm text-neutral-500 dark:border-surface-800 dark:text-neutral-400">
            Sold by{" "}
            <Link href={`/brands/${product.seller.storeSlug}`} className="font-medium text-brand-600 dark:text-accent-400">
              {product.seller.storeName}
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
