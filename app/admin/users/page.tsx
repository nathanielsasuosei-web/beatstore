import { listUsers } from "@/lib/data/users";
import { UsersTable } from "@/components/admin/users-table";
import { Stat } from "@/components/section";
import { formatMoney } from "@/lib/money";

export default async function AdminUsersPage() {
  const users = listUsers();
  const artists = users.filter((user) => user.role === "artist");
  const totalSpend = users.reduce((sum, user) => sum + user.spend, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl text-ash-50">Artists</h1>
        <p className="mt-1 text-sm text-ash-400">
          Everyone with an account. Promote someone to admin if they help you run the store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Artist accounts"
          value={String(artists.length)}
          hint={`${users.length} total users`}
        />
        <Stat label="Lifetime spend" value={formatMoney(totalSpend)} hint="Across all artists" />
        <Stat
          label="Repeat buyers"
          value={String(artists.filter((user) => user.orderCount > 1).length)}
          hint="More than one order"
        />
      </div>

      <UsersTable
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          stageName: user.stageName,
          phone: user.phone,
          country: user.country,
          emailVerified: user.emailVerified,
          orderCount: user.orderCount,
          spend: user.spend,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
