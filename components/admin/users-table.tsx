"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Search, Shield, Trash2, User } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  stageName: string | null;
  phone: string | null;
  country: string | null;
  emailVerified: boolean;
  orderCount: number;
  spend: number;
  createdAt: string;
  lastLoginAt: string | null;
};

export function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState("");

  const filtered = users.filter((user) => {
    if (!query.trim()) return true;
    const needle = query.toLowerCase();
    return (
      user.name.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle) ||
      (user.stageName ?? "").toLowerCase().includes(needle)
    );
  });

  async function act(id: string, body: Record<string, unknown>) {
    setFlash("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await safeJson(res);
    if (!res.ok || !json.ok) {
      setFlash(json.error ?? "Action failed");
      return;
    }
    setFlash("Updated.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists"
          className="input pl-10"
        />
      </div>

      {flash && (
        <p className=" border border-accent-400/30 bg-accent-400/10 px-3 py-2 text-xs text-accent-200">
          {flash}
        </p>
      )}

      <div className="surface-card overflow-x-auto">
        <table className="table-clean min-w-[820px]">
          <thead>
            <tr>
              <th>Artist</th>
              <th>Contact</th>
              <th>Orders</th>
              <th>Spend</th>
              <th>Joined</th>
              <th>Role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="text-sm font-medium">{user.stageName || user.name}</div>
                  <div className="text-xs text-ash-500">{user.name}</div>
                </td>
                <td className="text-xs text-ash-400">
                  <div>{user.email}</div>
                  <div>{[user.phone, user.country].filter(Boolean).join(" · ")}</div>
                  {user.emailVerified ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent-300">
                      <BadgeCheck className="h-3 w-3" /> verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => act(user.id, { action: "verify_email" })}
                      className="mt-1 text-[11px] text-amber-300 hover:underline"
                    >
                      mark verified
                    </button>
                  )}
                </td>
                <td className="text-sm">{user.orderCount}</td>
                <td className="text-sm font-semibold text-accent-300">{formatMoney(user.spend)}</td>
                <td className="text-xs text-ash-500">
                  {formatDate(user.createdAt)}
                  {user.lastLoginAt && <div>seen {formatDate(user.lastLoginAt)}</div>}
                </td>
                <td>
                  <span
                    className={`badge ${user.role === "admin" ? "bg-accent-400/15 text-accent-300" : "bg-ink-700 text-ash-400"}`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {user.role}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        act(user.id, {
                          action: "set_role",
                          role: user.role === "admin" ? "artist" : "admin",
                        })
                      }
                      className="btn btn-secondary btn-sm"
                    >
                      {user.role === "admin" ? "Make artist" : "Make admin"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(`Delete ${user.email}? Their orders stay in the books.`)
                        ) {
                          void act(user.id, { action: "delete" });
                        }
                      }}
                      className="btn btn-ghost btn-sm text-ash-500 hover:text-accent"
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-ash-500">
                  No users match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
