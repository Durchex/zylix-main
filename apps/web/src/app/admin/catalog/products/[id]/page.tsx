import { ProductForm } from "@/app/admin/catalog/products/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Edit Product</h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm productId={id} />
      </div>
    </div>
  );
}
