import { Avatar } from "@/components/ui/Avatar";

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export function TeamGrid({ title, members }: { title: string; members: TeamMember[] }) {
  return (
    <section className="border-t border-neutral-200 py-8 dark:border-surface-800">
      <h2 className="mb-4 text-lg font-bold text-ink-900 dark:text-neutral-50">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {members.map((member) => (
          <div key={member.name} className="rounded-2xl border border-neutral-200 p-5 dark:border-surface-800">
            <Avatar name={member.name} size="lg" />
            <h3 className="mt-3 text-sm font-semibold text-ink-900 dark:text-neutral-100">{member.name}</h3>
            <p className="text-xs font-medium text-brand-600 dark:text-accent-400">{member.role}</p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{member.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
