"use client";

import { ProductForm } from "@/app/admin/catalog/products/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Add Product</h1>
      <div className="mt-6 max-w-3xl">
        <ProductForm />
      </div>
    </div>
  );
}
