"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminUsersApi } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api-client";
import type { AdminUser } from "@/types/admin";

const statusBadgeVariant: Record<AdminUser["status"], "success" | "neutral" | "warning" | "error"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  BANNED: "error",
  PENDING_VERIFICATION: "neutral",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(() => {
    adminUsersApi
      .list({ search: search || undefined, role: role || undefined })
      .then((res) => {
        setError(null);
        setUsers(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong."));
  }, [search, role]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(user: AdminUser, status: AdminUser["status"]) {
    setActioningId(user.id);
    try {
      await adminUsersApi.updateStatus(user.id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Users</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-xs">
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="SELLER">Seller</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        {!users ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No users found.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{user.email}</td>
                  <td className="px-4 py-3 text-neutral-500">{user.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant[user.status]}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== "ADMIN" && (
                      <div className="flex justify-end gap-2">
                        {user.status !== "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actioningId === user.id}
                            onClick={() => handleStatusChange(user, "ACTIVE")}
                          >
                            Reactivate
                          </Button>
                        )}
                        {user.status !== "SUSPENDED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actioningId === user.id}
                            onClick={() => handleStatusChange(user, "SUSPENDED")}
                          >
                            Suspend
                          </Button>
                        )}
                        {user.status !== "BANNED" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            isLoading={actioningId === user.id}
                            onClick={() => handleStatusChange(user, "BANNED")}
                          >
                            Ban
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {users && <p className="mt-3 text-sm text-neutral-500">{total} user{total === 1 ? "" : "s"} total</p>}
    </div>
  );
}
