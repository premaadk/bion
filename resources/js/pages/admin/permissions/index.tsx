import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import permissionsRoutes from "@/routes/admin/permissions";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import {
  KeyRound,
  CheckCircle2,
  Users,
  ShieldCheck,
  Search,
  Pencil,
  Trash2,
  CalendarClock,
  Plus,
  Users2,
  Table2,
  KeySquare,
  Key,
} from "lucide-react";

/* ============ Types ============ */
type Id = string | number;

type PermissionRow = {
  id: Id;
  name: string;
  display_name?: string | null;
  description?: string | null;
  guard_name?: string | null;
  roles_count?: number | null;
  users_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
};

type PageProps = {
  permissions: PermissionRow[];
  totals?: {
    roles?: number;
    users?: number;
  };
};

/* ============ Helpers ============ */
const toInt = (v: Id): number =>
  typeof v === "number" ? v : parseInt(String(v), 10);

const fmtDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value;
  }
};

// Longgarkan tipe wayfinder supaya aman dipakai
type WF = {
  index: { url: () => string };
  create: { url: () => string };
  edit: { url: (p: { permission: number }) => string };
  update?: { url: (p: { permission: number }) => string };
  destroy: { url: (p: { permission: number }) => string };
  assign?: {
    roles?: { url: () => string };
    users?: { url: () => string };
  };
};
const routes = permissionsRoutes as unknown as WF;

/* ============ Page ============ */
export default function Index({ permissions, totals }: PageProps) {
  const { url } = usePage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuard, setSelectedGuard] = useState<string>("");

  // Tabs (sinkron seperti roles)
  const isIndex = url.startsWith("/admin/permissions") && !url.includes("/create") && !url.includes("/edit") && !url.includes("/assign");
  const isAssignRoles = url.includes("/permissions/assign-to-roles");
  const isAssignUsers = url.includes("/permissions/assign-for-user");
  const isCreateOrEdit = url.includes("/permissions/create") || /\/permissions\/\d+\/edit/.test(url);
  const isCreate = url.includes("/permissions/create");

  const totalPerms = permissions.length;
  const totalRoles = typeof totals?.roles === "number" ? totals.roles : undefined;
  const totalUsers = typeof totals?.users === "number" ? totals.users : undefined;

  const guardOptions = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => p.guard_name && set.add(p.guard_name));
    return Array.from(set.size ? set : new Set(["web"])).sort();
  }, [permissions]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return permissions.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.display_name ?? "").toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term);
      const matchesGuard = !selectedGuard || (p.guard_name ?? "") === selectedGuard;
      return matchesSearch && matchesGuard;
    });
  }, [permissions, searchTerm, selectedGuard]);

  // Actions
  const onEdit = (id: Id) => router.visit(routes.edit.url({ permission: toInt(id) }));

  const onDelete = (id: Id) =>
    router.delete(routes.destroy.url({ permission: toInt(id) }), {
      preserveScroll: true,
      preserveState: true,
    });

  return (
    <AppLayout>
      <Head title="Management Permissions" />

      <PageHero
        badge={{ text: "Kelola Permissions", icon: <KeySquare className="h-4 w-4" /> }}
        title="Management Permissions"
        description="Kelola daftar permission, assignment, dan kontrol akses berbasis Spatie."
        gradient={{
          from: "#6366f1",
          via: "#7c3aed",
          to: "#8b5cf6",
          direction: "to right",
          overlayOpacity: 0.66,
        }}
        media={{
          imageUrl: "/images/hero/abstract-wave.jpg",
          objectPosition: "center",
          dimOpacity: 0.2,
        }}
        stats={[
          { value: totalPerms, label: "Total Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      {/* Content wrapper */}
      <div
        className="
          container mx-auto max-w-7xl
          px-4 pt-6
          pb-[calc(env(safe-area-inset-bottom)+96px)]
          md:pb-8
        "
      >
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
              <span className="text-xs font-medium leading-tight">Create</span>
            </Link>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={routes.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <KeySquare className="h-5 w-5" />
            Management Permissions
          </Link>

          <Link
            href={routes.assign?.roles?.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssignRoles ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Table2 className="h-5 w-5" />
            Assignment to Roles
          </Link>

          <Link
            href={routes.assign?.users?.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssignUsers ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Users2 className="h-5 w-5" />
            Assignment for User
          </Link>

          <Link
            href={routes.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            Create Permissions
          </Link>
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari permission…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={selectedGuard}
              onChange={(e) => setSelectedGuard(e.target.value)}
            >
              <option value="">Semua Guard</option>
              {guardOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-medium text-gray-700">Permission</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Guard</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Used By Roles</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Users</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Created</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((perm) => (
                  <tr key={String(perm.id)} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{perm.display_name ?? perm.name}</div>
                        <div className="font-mono text-xs text-gray-500">{perm.name}</div>
                        {perm.description && (
                          <p className="mt-1 text-[13px] text-gray-600">{perm.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        {perm.guard_name ?? "web"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{perm.roles_count ?? "—"}</td>
                    <td className="px-6 py-4">{perm.users_count ?? "—"}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-gray-400" />
                          <span>{fmtDate(perm.created_at)}</span>
                        </div>
                        {perm.updated_at && perm.updated_at !== perm.created_at && (
                          <div className="mt-1 text-xs text-gray-500">
                            Updated: {fmtDate(perm.updated_at)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(perm.canEdit ?? true) && (
                          <button
                            className="rounded p-1 text-gray-500 hover:text-indigo-600"
                            title="Edit Permission"
                            onClick={() => onEdit(perm.id)}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        )}
                        {(perm.canDelete ?? true) && (
                          <button
                            className="rounded p-1 text-gray-500 hover:text-red-600"
                            title="Delete Permission"
                            onClick={() => onDelete(perm.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-14 text-center">
              <KeyRound className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada permission yang ditemukan</p>
            </div>
          )}
        </div>

        {/* Mobile list */}
        <div className="space-y-4 md:hidden">
          {filtered.map((perm) => (
            <div key={String(perm.id)} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{perm.display_name ?? perm.name}</div>
                  <div className="font-mono text-xs text-gray-500">{perm.name}</div>
                </div>
                <div className="ml-2 flex items-center gap-2">
                  {(perm.canEdit ?? true) && (
                    <button
                      onClick={() => onEdit(perm.id)}
                      className="rounded p-2 text-gray-500 hover:text-indigo-600"
                      title="Edit Permission"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                  )}
                  {(perm.canDelete ?? true) && (
                    <button
                      onClick={() => onDelete(perm.id)}
                      className="rounded p-2 text-gray-500 hover:text-red-600"
                      title="Delete Permission"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Guard</div>
                  <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                    {perm.guard_name ?? "web"}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Used By Roles</div>
                  <div>{perm.roles_count ?? "—"}</div>
                </div>
              </div>

              <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
                Created: {fmtDate(perm.created_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}