import { Container } from "@/components/ui/Container";

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated {updatedAt}</p>
      <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-sm leading-relaxed text-neutral-700 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </Container>
  );
}
