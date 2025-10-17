import React, { useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import routesRaw from "@/routes/admin/permissions";
import {
  KeyRound,
  Users,
  ShieldCheck,
  CheckCircle2,
  Grid2x2,
  Plus,
  Shield,
  X,
  Check,
  Crown,
  Key,
  Search,
  Table2,
  Users2,
} from "lucide-react";

/* ====================== Types ====================== */
type Id = string | number;

type PermissionRow = {
  id: Id;
  name: string;
  display_name?: string | null;
  description?: string | null;
  guard_name?: string | null;
  category?: string | null;
};

type RoleRow = {
  id: Id;
  name: string;
  display_name?: string | null;
  guard_name?: string | null;
  permissions: string[];
};

type UserRow = {
  id: Id;
  name: string;
  email: string;
  avatar_url?: string | null;
  department?: string | null;
  roles: string[];
  direct_permissions: string[];
  last_login_at?: string | null;
};

type PageProps = {
  view: "roles" | "users";
  roles: RoleRow[];
  permissions: PermissionRow[];
  users?: UserRow[];
};

/* Wayfinder (longgarkan tipe agar aman) */
type PermRoutes = {
  index: { url: () => string };
  create: { url: () => string };
  assign: { roles: { url: () => string }; users: { url: () => string } };
  // toggle mungkin ada / mungkin tidak di file route helper;
  // kita sediakan pencarian luwes + fallback hardcoded.
  [key: string]: any;
};
const routes = routesRaw as unknown as PermRoutes;

/* ====================== Helpers ====================== */
const roleLabel = (r: RoleRow) =>
  r.display_name && r.display_name.trim().length > 0
    ? r.display_name
    : r.name
        .split(/[-_ ]/)
        .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
        .join(" ");

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const CATEGORY_COLORS: Record<string, string> = {
  Article: "border-blue-200 bg-blue-50 text-blue-800",
  User: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Category: "border-violet-200 bg-violet-50 text-violet-800",
  Media: "border-orange-200 bg-orange-50 text-orange-800",
  System: "border-rose-200 bg-rose-50 text-rose-800",
};

async function postJSON(url: string, payload: unknown) {
  const token =
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
    (window as any)?.Laravel?.csrfToken;

  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(token ? { "X-CSRF-TOKEN": token } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
  }
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ambil URL toggle dari helper route bila ada; jika tidak, gunakan fallback path
function urlToggleRole(): string {
  const r: any = routes;
  return (
    r?.toggle?.role?.url?.() ||
    r?.assign?.toggle?.role?.url?.() ||
    r?.assign?.toggle_role?.url?.() ||
    r?.["admin.permissions.assign.toggle.role"]?.url?.() ||
    "/admin/permissions/toggle-role-permission"
  );
}
function urlToggleUser(): string {
  const r: any = routes;
  return (
    r?.toggle?.user?.url?.() ||
    r?.assign?.toggle?.user?.url?.() ||
    r?.assign?.toggle_user?.url?.() ||
    r?.["admin.permissions.assign.toggle.user"]?.url?.() ||
    "/admin/permissions/toggle-user-permission"
  );
}

/* ====================== Component ====================== */
export default function Assign({
  view,
  roles: incomingRoles,
  permissions: perms,
  users = [],
}: PageProps) {
  const { url } = usePage();
  const [roles, setRoles] = useState<RoleRow[]>(incomingRoles);
  const [pendingCell, setPendingCell] = useState<string | null>(null);

  // Hero stats
  const totalPerms = perms.length;
  const totalRoles = roles.length;
  const totalUsers = users.length;
  const assignedPairs = useMemo(
    () => roles.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0),
    [roles]
  );

  // Tabs
  const isIndex = url.startsWith("/admin/permissions") && !url.includes("/assign");
  const isAssignRoles = url.includes("/permissions/assign-to-roles");
  const isAssignUsers = url.includes("/permissions/assign-for-user");
  const isCreate = url.includes("/permissions/create");

  // Users filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      const s =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const r = !userRoleFilter || u.roles.includes(userRoleFilter);
      return s && r;
    });
  }, [users, userSearch, userRoleFilter]);

  // ====== Toggle role <-> permission (REAL-TIME SAVE) ======
  const cellKey = (roleId: Id, perm: string) => `${roleId}:${perm}`;

  async function toggleRolePermission(
    role: RoleRow,
    permission: string,
    allow: boolean
  ) {
    const key = cellKey(role.id, permission);
    if (pendingCell === key) return;

    // Super Admin tidak bisa diubah
    const rn = role.name.toLowerCase();
    if (rn === "super admin" || rn === "super-admin") return;

    setPendingCell(key);

    // Optimistic
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== role.id) return r;
        const has = r.permissions.includes(permission);
        if (allow && !has)
          return { ...r, permissions: [...r.permissions, permission] };
        if (!allow && has)
          return {
            ...r,
            permissions: r.permissions.filter((p) => p !== permission),
          };
        return r;
      })
    );

    try {
      await postJSON(urlToggleRole(), {
        role_id: role.id,
        permission,
        allow, // boolean
      });
    } catch (e) {
      // Rollback on error
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== role.id) return r;
          const has = r.permissions.includes(permission);
          if (allow && has)
            return {
              ...r,
              permissions: r.permissions.filter((p) => p !== permission),
            };
          if (!allow && !has)
            return { ...r, permissions: [...r.permissions, permission] };
          return r;
        })
      );
      console.error(e);
      alert("Gagal menyimpan perubahan permission untuk role.");
    } finally {
      setPendingCell(null);
    }
  }

  /* ====================== UI ====================== */
  return (
    <AppLayout>
      <Head
        title={
          view === "roles"
            ? "Permissions → Assign to Roles"
            : "Permissions → Assign for User"
        }
      />

      <PageHero
        badge={{ text: "Kelola Permissions", icon: <KeyRound className="h-4 w-4" /> }}
        title={view === "roles" ? "Role-Permission Matrix" : "User Assignment"}
        description={
          view === "roles"
            ? "Klik untuk memberi/menarik permission pada role. Perubahan disimpan otomatis."
            : "Kelola direct permission per-user. Perubahan disimpan otomatis."
        }
        gradient={{
          from: "#5b6bdc",
          via: "#6a5ad6",
          to: "#7b4fd1",
          direction: "to right",
          overlayOpacity: 0.66,
        }}
        media={{
          imageUrl: "/images/hero/abstract-wave.jpg",
          objectPosition: "center",
          dimOpacity: 0.18,
        }}
        stats={[
          { value: totalPerms, label: "Total Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: totalRoles, label: "Total Roles", icon: <ShieldCheck className="h-5 w-5" /> },
          { value: totalUsers, label: "Total Users", icon: <Users className="h-5 w-5" /> },
          { value: assignedPairs, label: "Assignments", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      <div
        className="
          container mx-auto max-w-7xl
          px-4 pt-6
          pb-[calc(env(safe-area-inset-bottom)+96px)]
          md:pb-8
        "
      >
        {/* Tabs */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={routes.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Key className="h-5 w-5" />
            Management Permissions
          </Link>

          <Link
            href={routes.assign.roles.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssignRoles
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Grid2x2 className="h-5 w-5" />
            Assignment to Roles
          </Link>

          <Link
            href={routes.assign.users.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssignUsers
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Users className="h-5 w-5" />
            Assignment for User
          </Link>

          <Link
            href={routes.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreate
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            Create Permissions
          </Link>
        </div>

        {/* Mobile tabs — full width, icon top text bottom */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-4 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <Link
              href={routes.index.url()}
              className={`fcol-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Key className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-tight">Permissions</span>
            </Link>

            <Link
              href={routes.assign?.roles?.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isAssignRoles ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Table2 className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-tight">To Roles</span>
            </Link>

            <Link
              href={routes.assign?.users?.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isAssignUsers ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Users2 className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-tight">For Users</span>
            </Link>

            <Link
              href={routes.create.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isCreate ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-tight">Edit</span>
            </Link>
          </div>
        </div>

        {/* ===== MATRIX TO ROLES ===== */}
        {view === "roles" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-6 py-4 text-left font-medium text-gray-700 min-w-[320px]">
                      Permission
                    </th>
                    {roles.map((r) => (
                      <th
                        key={r.id}
                        className="px-4 py-4 text-center font-medium text-gray-700 min-w-[140px]"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{roleLabel(r)}</span>
                          <span className="text-xs text-gray-500 font-normal">
                            {r.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {perms.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60">
                      {/* Permission info */}
                      <td className="sticky left-0 z-[1] bg-white px-6 py-4 border-r">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {p.display_name ?? p.name}
                          </div>
                          <div className="font-mono text-xs text-gray-500">
                            {p.name}
                          </div>
                          {(p.category ?? "").length > 0 && (
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
                                CATEGORY_COLORS[p.category ?? ""] ??
                                "border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              {p.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cells */}
                      {roles.map((r) => {
                        const isSuper =
                          r.name.toLowerCase() === "super admin" ||
                          r.name.toLowerCase() === "super-admin";
                        const allowed = isSuper || r.permissions.includes(p.name);
                        const busy = pendingCell === cellKey(r.id, p.name);

                        return (
                          <td
                            key={`${r.id}-${p.id}`}
                            className="px-4 py-4 text-center"
                          >
                            <button
                              type="button"
                              disabled={isSuper || busy}
                              onClick={() =>
                                toggleRolePermission(r, p.name, !allowed)
                              }
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                isSuper
                                  ? "bg-yellow-100 text-yellow-600 cursor-not-allowed"
                                  : allowed
                                  ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              } ${busy ? "opacity-60" : ""}`}
                              title={
                                isSuper
                                  ? "Super Admin: akses penuh"
                                  : allowed
                                  ? "Klik untuk revoke"
                                  : "Klik untuk grant"
                              }
                            >
                              {isSuper ? (
                                <Crown className="h-4 w-4" />
                              ) : allowed ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== USER ASSIGNMENT ===== */}
        {view === "users" && (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari user…"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="">Semua Role</option>
                  {[...new Set(roles.map((r) => r.name))].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-6 py-4 font-medium text-gray-700">
                        User
                      </th>
                      <th className="px-6 py-4 font-medium text-gray-700">
                        Roles
                      </th>
                      <th className="px-6 py-4 font-medium text-gray-700">
                        Direct Permissions
                      </th>
                      <th className="px-6 py-4 font-medium text-gray-700">
                        Last Login
                      </th>
                      <th className="px-6 py-4 font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => (
                      <UserRowItem key={u.id} user={u} permissions={perms} />
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="py-14 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">Tidak ada user.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

/* ===== User row with inline direct-permission picker (REAL-TIME SAVE) ===== */
function UserRowItem({
  user,
  permissions,
}: {
  user: UserRow;
  permissions: PermissionRow[];
}) {
  const [open, setOpen] = useState(false);
  const [directPerms, setDirectPerms] = useState<string[]>(
    user.direct_permissions ?? []
  );
  const [pending, setPending] = useState<string | null>(null);

  async function toggleUserPerm(perm: string, allow: boolean) {
    if (pending === perm) return;
    setPending(perm);

    // optimistic
    setDirectPerms((prev) => {
      const has = prev.includes(perm);
      if (allow && !has) return [...prev, perm];
      if (!allow && has) return prev.filter((p) => p !== perm);
      return prev;
    });

    try {
      await postJSON(urlToggleUser(), {
        user_id: user.id,
        permission: perm,
        allow, // boolean
      });
    } catch (e) {
      // rollback
      setDirectPerms((prev) => {
        const has = prev.includes(perm);
        if (allow && has) return prev.filter((p) => p !== perm);
        if (!allow && !has) return [...prev, perm];
        return prev;
      });
      console.error(e);
      alert("Gagal menyimpan direct permission user.");
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <tr className="hover:bg-gray-50/60">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
              {user.avatar_url ? (
                <img src={user.avatar_url} className="h-10 w-10 object-cover" />
              ) : (
                <Shield className="m-2 h-6 w-6 text-gray-300" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-600">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {user.roles.length ? (
              user.roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs"
                >
                  {r}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          {directPerms.length ? (
            <span className="rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
              {directPerms.length} permissions
            </span>
          ) : (
            <span className="text-xs text-gray-400">None</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {fmtDate(user.last_login_at)}
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Key className="h-4 w-4" />
            Manage
          </button>
        </td>
      </tr>

      {open && (
        <tr className="bg-gray-50/50">
          <td colSpan={5} className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {permissions.map((p) => {
                const has = directPerms.includes(p.name);
                const busy = pending === p.name;
                return (
                  <button
                    key={p.id}
                    disabled={busy}
                    onClick={() => toggleUserPerm(p.name, !has)}
                    className={`flex items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                      has
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-gray-200 hover:bg-white"
                    } ${busy ? "opacity-60" : ""}`}
                  >
                    <div>
                      <div className="font-medium">
                        {p.display_name ?? p.name}
                      </div>
                      <div className="font-mono text-xs text-gray-500">
                        {p.name}
                      </div>
                      {p.description && (
                        <div className="mt-1 text-xs text-gray-600">
                          {p.description}
                        </div>
                      )}
                    </div>
                    {has ? (
                      <Check className="mt-1 h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="mt-1 h-4 w-4 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}