import { Avatar } from "@/components/ui/Avatar";

// Placeholder leadership copy pending real headshots/bios — swap before
// this section is treated as representing real, named individuals.
const TEAM = [
  {
    name: "Ada Bello",
    role: "Founder & CEO",
    bio: "15+ years in African e-commerce and consumer electronics retail.",
  },
  {
    name: "Tunde Okafor",
    role: "Head of Operations",
    bio: "Oversees logistics, fulfillment, and seller onboarding nationwide.",
  },
  {
    name: "Ngozi Eze",
    role: "Head of Engineering",
    bio: "Leads the team building the storefront, payments, and catalog systems.",
  },
];

export function TeamSection() {
  return (
    <section className="border-t border-neutral-200 py-10 dark:border-surface-800">
      <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-neutral-50">Leadership</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {TEAM.map((member) => (
          <div
            key={member.name}
            className="rounded-2xl border border-neutral-200 p-6 text-center dark:border-surface-800"
          >
            <Avatar name={member.name} size="lg" className="mx-auto h-20 w-20 text-xl" />
            <h3 className="mt-4 text-sm font-bold text-ink-900 dark:text-neutral-50">{member.name}</h3>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-accent-400">
              {member.role}
            </p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{member.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
