import { SellerDetailView } from "@/app/admin/sellers/[id]/SellerDetailView";

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Seller Detail</h1>
      <div className="mt-6 max-w-xl">
        <SellerDetailView sellerId={id} />
      </div>
    </div>
  );
}
