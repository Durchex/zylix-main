import { Avatar } from "@/components/ui/Avatar";

// Names and titles only. Bios are left out deliberately: the previous ones
// were placeholder copy making specific claims (years of experience, areas of
// responsibility) about people who were never real, and writing new ones for
// real individuals should come from them, not from guesswork.
const TEAM = [
  { name: "Chukwu Victor", role: "Founder & CEO" },
  { name: "Mercy Ekpere", role: "Head of Operations" },
  { name: "Alex Okoji", role: "Head of Engineering" },
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
          </div>
        ))}
      </div>
    </section>
  );
}
