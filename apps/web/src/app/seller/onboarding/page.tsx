"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { sellerOnboardingApi } from "@/lib/api/seller-dashboard";
import { ApiRequestError } from "@/lib/api-client";

const onboardingFormSchema = z.object({
  storeName: z.string().trim().min(1, "Store name is required"),
  storeSlug: z
    .string()
    .trim()
    .min(1, "Store URL is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({ resolver: zodResolver(onboardingFormSchema) });

  async function onSubmit(values: OnboardingFormValues) {
    setSubmitError(null);
    try {
      await sellerOnboardingApi.apply(values);
      router.push("/seller");
    } catch (err) {
      setSubmitError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Become a Zylix Seller</h1>
      <p className="mt-2 text-neutral-600">
        Tell us about your store. Your application will be reviewed before your products go live.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {submitError && <Alert variant="error">{submitError}</Alert>}
        <Input label="Store name" error={errors.storeName?.message} {...register("storeName")} />
        <Input
          label="Store URL"
          helperText="zylix.com/brands/your-slug"
          error={errors.storeSlug?.message}
          {...register("storeSlug")}
        />
        <Textarea label="About your store (optional)" rows={4} {...register("description")} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Submit application
        </Button>
      </form>
    </div>
  );
}
