import { SellerDashboardShell } from "@/components/seller/SellerDashboardShell";
import { SellerProductForm } from "@/app/seller/products/SellerProductForm";

export default async function EditSellerProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <SellerDashboardShell>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Edit Product</h1>
      <div className="mt-6 max-w-3xl">
        <SellerProductForm productId={id} />
      </div>
    </SellerDashboardShell>
  );
}
