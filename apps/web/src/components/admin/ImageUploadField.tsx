"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { uploadFile, ApiRequestError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function ImageUploadField({
  label,
  value,
  onChange,
  className,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const result = await uploadFile("/admin/uploads", file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = previewUrl ?? (value || null);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</p>}

      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-300 bg-neutral-50 dark:border-surface-700 dark:bg-surface-800">
          {displayUrl ? (
            <Image src={displayUrl} alt="Product preview" fill className="object-contain p-1" unoptimized={Boolean(previewUrl)} />
          ) : (
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-neutral-300 dark:text-surface-600" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 5h16v14H4zM4 15l4-4 4 4 4-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Spinner className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`image-upload-${label ?? "field"}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {value || previewUrl ? "Replace image" : "Upload image"}
          </Button>
          {value && !isUploading && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setPreviewUrl(null);
              }}
              className="text-xs font-medium text-error hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
