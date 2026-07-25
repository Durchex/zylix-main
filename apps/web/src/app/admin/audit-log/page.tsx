"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminAuditLogApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AuditLogEntry } from "@/types/admin";

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminAuditLogApi
      .list()
      .then((res) => setEntries(res.items))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Audit Log</h1>
      <p className="mt-2 text-sm text-neutral-600">
        A record of sensitive admin actions — seller approvals/rejections and user status changes.
      </p>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!entries ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No admin actions recorded yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{entry.action}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {entry.entityType} · {entry.entityId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(entry.createdAt).toLocaleString("en-NG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
