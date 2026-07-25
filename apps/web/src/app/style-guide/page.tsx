import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Rating } from "@/components/ui/Rating";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { DialogDemo } from "@/app/style-guide/DialogDemo";

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Zylix internal design system reference.",
};

const colorSwatches: Array<{ name: string; className: string }> = [
  { name: "brand-500", className: "bg-brand-500" },
  { name: "brand-700", className: "bg-brand-700" },
  { name: "ink-900", className: "bg-ink-900" },
  { name: "ink-700", className: "bg-ink-700" },
  { name: "neutral-500", className: "bg-neutral-500" },
  { name: "neutral-200", className: "bg-neutral-200" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "error", className: "bg-error" },
  { name: "info", className: "bg-info" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-neutral-200 py-12">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <Container className="py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-600">Zylix</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900">Design System</h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Internal reference for the Zylix component library. Every component here is
        production code from <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">
          src/components/ui
        </code>{" "}
        — nothing on this page is a mockup.
      </p>

      <Section title="Color Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {colorSwatches.map((swatch) => (
            <div key={swatch.name}>
              <div className={`h-16 w-full rounded-xl ${swatch.className}`} />
              <p className="mt-2 text-xs text-neutral-600">{swatch.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-3">
          <p className="text-4xl font-bold text-ink-900">Technology Made Simple.</p>
          <p className="text-2xl font-semibold text-ink-900">Section Heading</p>
          <p className="text-lg font-medium text-ink-900">Card Title</p>
          <p className="text-base text-neutral-700">
            Body copy — used for product descriptions and general content.
          </p>
          <p className="text-sm text-neutral-500">Small / helper text — metadata, captions.</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="brand">Featured</Badge>
          <Badge variant="success">In Stock</Badge>
          <Badge variant="warning">Low Stock</Badge>
          <Badge variant="error">Out of Stock</Badge>
          <Badge variant="info">New</Badge>
        </div>
      </Section>

      <Section title="Form Controls">
        <div className="grid max-w-md gap-4">
          <Input label="Email address" placeholder="you@example.com" />
          <Input label="Password" type="password" error="Password must be at least 8 characters" />
          <Textarea label="Message" placeholder="Write a review..." />
          <Select label="Category">
            <option>Smartphones</option>
            <option>Laptops</option>
            <option>Gaming</option>
          </Select>
          <Checkbox label="Subscribe to newsletter" defaultChecked />
        </div>
      </Section>

      <Section title="Rating & Price">
        <div className="flex flex-col gap-3">
          <Rating value={4.5} count={128} />
          <PriceTag amount={1250000} compareAtAmount={1450000} />
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex items-center gap-3">
          <Avatar name="Ada Obi" size="sm" />
          <Avatar name="Chidi Okafor" size="md" />
          <Avatar name="Zainab Bello" size="lg" />
        </div>
      </Section>

      <Section title="Alerts">
        <div className="space-y-3">
          <Alert variant="success" title="Order confirmed">
            Your order #ZLX-10234 has been placed successfully.
          </Alert>
          <Alert variant="warning" title="Low stock">
            Only 2 units left of this item.
          </Alert>
          <Alert variant="error" title="Payment failed">
            We couldn&apos;t process your card. Please try again.
          </Alert>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid max-w-sm gap-4">
          <Card>
            <CardHeader>
              <p className="font-semibold text-ink-900">Card Title</p>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-neutral-600">
                Cards are the base surface for product tiles, order summaries, and dashboard
                widgets.
              </p>
            </CardBody>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Skeleton (loading state)">
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Section>

      <Section title="Dialog">
        <DialogDemo />
      </Section>
    </Container>
  );
}
