import React, { useMemo, useState } from "react";
import { Link, router, Head, usePage } from "@inertiajs/react";
import roles from "@/routes/admin/roles";            // resource (index, create, edit, destroy, assign)
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  KeyRound,
  Search,
  Pencil,
  Trash2,
  X,
  Crown,
  Key,
  CalendarClock,
  Shield,
  Plus,
} from "lucide-react";

/* ====================== Types ====================== */
type Id = string | number;

type RoleRow = {
  id: Id;
  name: string;
  permissions: string[];
  display_name?: string | null;
  description?: string | null;
  guard_name?: string | null;
  userCount?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
};

type PageProps = {
  roles: RoleRow[];
  totals?: {
    users?: number;
    permissions?: number;
  };
};

/* ====================== Helpers ====================== */
const ROLE_COLORS: Record<string, string> = {
  "Super Admin":
    "border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-400/40 dark:bg-yellow-400/10 dark:text-yellow-200",
  Admin:
    "border-purple-300 bg-purple-50 text-purple-900 dark:border-purple-400/40 dark:bg-purple-400/10 dark:text-purple-200",
  Author:
    "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-200",
  Editor:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200",
  default:
    "border-gray-300 bg-gray-50 text-gray-900 dark:border-gray-400/40 dark:bg-gray-400/10 dark:text-gray-100",
};

// robust parse ISO / timestamp / "Y-m-d H:i:s"
const toDate = (val?: string | number | Date | null): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return new Date(s.length === 10 ? n * 1000 : n);
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s.replace(" ", "T") + "Z");
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDate = (value?: string | null) => {
  const d = toDate(value ?? undefined);
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value ?? "—";
  }
};

/* ====================== Page ====================== */
export default function Index({ roles: items, totals }: PageProps) {
  const { url } = usePage();

  // ---- Stats (Hero) ----
  const totalRoles = items.length;
  const totalPerms = useMemo(
    () =>
      typeof totals?.permissions === "number"
        ? totals.permissions
        : new Set(items.flatMap((r) => r.permissions ?? [])).size,
    [items, totals?.permissions]
  );
  const totalUsers = useMemo(
    () =>
      typeof totals?.users === "number"
        ? totals.users
        : items.reduce(
            (sum, r) => sum + (typeof r.userCount === "number" ? r.userCount : 0),
            0
          ),
    [items, totals?.users]
  );

  // ---- Filters & UI state ----
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuard, setSelectedGuard] = useState<string>("");
  const [showPermsFor, setShowPermsFor] = useState<Id | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<RoleRow | null>(null);

  const guardOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => r.guard_name && set.add(r.guard_name));
    return Array.from(set.size ? set : new Set(["web"])).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((r) => {
      const matchesSearch =
        !term ||
        r.name.toLowerCase().includes(term) ||
        (r.display_name ?? "").toLowerCase().includes(term) ||
        (r.description ?? "").toLowerCase().includes(term);
      const matchesGuard =
        !selectedGuard || (r.guard_name ?? "") === selectedGuard;
      return matchesSearch && matchesGuard;
    });
  }, [items, searchTerm, selectedGuard]);

  // ---- Wayfinder (longgarkan tipe) ----
  type WFRolesLoose = {
    edit: { url: (p: { role: Id }) => string };
    destroy: { url: (p: { role: Id }) => string };
    index: { url: () => string };
    create: { url: () => string };
    assign: { url: () => string };
  };
  const wf = roles as unknown as WFRolesLoose;

  // ---- Actions ----
  const onEdit = (id: Id) => router.visit(wf.edit.url({ role: id }));
  const doDelete = () => {
    if (!showDeleteModal) return;
    router.delete(wf.destroy.url({ role: showDeleteModal.id }), {
      preserveScroll: true,
      preserveState: true,
      onFinish: () => setShowDeleteModal(null),
    });
  };

  // ---- Tabs (View Selector) ----
  const isIndex =
    url.startsWith("/admin/roles") &&
    !url.includes("/assign") &&
    !url.includes("/create") &&
    !/\/edit($|\/)/.test(url);
  const isAssign = url.includes("/admin/roles/assign");
  const isCreateOrEdit =
    url.includes("/admin/roles/create") ||
    /\/admin\/roles\/[^/]+\/edit/.test(url);

  return (
    <AppLayout>
      <Head title="Management Roles" />

      <PageHero
        badge={{ text: "Kelola Peran", icon: <ShieldCheck className="h-4 w-4" /> }}
        title="Manajemen Peran"
        description="Kelola peran pengguna, atur hak akses, dan kontrol keamanan sistem dengan mudah dan efisien."
        gradient={{
          from: "#203b8a",
          via: "#2a4db3",
          to: "#3560dc",
          direction: "to right",
          overlayOpacity: 0.66,
        }}
        media={{
          imageUrl: "/images/hero/abstract-wave.jpg",
          objectPosition: "center",
          dimOpacity: 0.2,
        }}
        stats={[
          { value: totalRoles, label: "Total Roles", icon: <ShieldCheck className="h-5 w-5" /> },
          { value: totalUsers, label: "Total Users", icon: <Users className="h-5 w-5" /> },
          { value: totalPerms, label: "Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      {/* ====== CONTENT WRAPPER (padding mobile) ====== */}
      <div
        className="
          container mx-auto max-w-7xl
          px-4 pt-6
          pb-[calc(env(safe-area-inset-bottom)+96px)]
          md:pb-8
        "
      >
        {/* ===== View Selector ===== */}
        {/* Mobile segmented */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <Link
              href={wf.index.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isIndex ? "page" : undefined}
            >
              <Shield className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Roles</span>
            </Link>

            <Link
              href={wf.assign.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isAssign ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              } border-l`}
              aria-current={isAssign ? "page" : undefined}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Assign</span>
            </Link>

            <Link
              href={wf.create.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isCreateOrEdit ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              } border-l`}
              aria-current={isCreateOrEdit ? "page" : undefined}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Create</span>
            </Link>
          </div>
        </div>

        {/* Desktop full buttons */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={wf.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
            aria-current={isIndex ? "page" : undefined}
          >
            <Shield className="h-5 w-5" />
            Roles Management
          </Link>

          <Link
            href={wf.assign.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssign
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
            aria-current={isAssign ? "page" : undefined}
          >
            <Users className="h-5 w-5" />
            User Assignment
          </Link>

          <Link
            href={wf.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreateOrEdit
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
            aria-current={isCreateOrEdit ? "page" : undefined}
          >
            <Plus className="h-5 w-5" />
            Create Role
          </Link>
        </div>

        {/* ===== Toolbar (search + guard) ===== */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari role..."
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

        {/* ===== Desktop Table ===== */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-medium text-gray-700">Role</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Guard</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Users</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Permissions</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Created</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const perms = r.permissions ?? [];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium border ${
                                ROLE_COLORS[r.name] || ROLE_COLORS.default
                              }`}
                            >
                              {r.display_name ?? r.name}
                            </span>
                          </div>
                          <p className="font-mono text-xs text-gray-500">{r.name}</p>
                          {r.description && (
                            <p className="mt-1 text-[13px] text-gray-600">{r.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          {r.guard_name ?? "web"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{r.userCount ?? 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setShowPermsFor(r.id)}
                          className="rounded bg-indigo-50 px-3 py-1 text-indigo-700 transition-colors hover:bg-indigo-100"
                        >
                          {perms.includes("*") ? "All" : perms.length} permissions
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-gray-400" />
                            <span>{fmtDate(r.created_at)}</span>
                          </div>
                          {r.updated_at && r.updated_at !== r.created_at && (
                            <div className="mt-1 text-xs text-gray-500">
                              Updated: {fmtDate(r.updated_at)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(r.canEdit ?? true) && (
                            <button
                              onClick={() => onEdit(r.id)}
                              className="rounded p-1 text-gray-500 hover:text-indigo-600"
                              title="Edit Role"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                          )}
                          {(r.canDelete ?? true) && (
                            <button
                              onClick={() => setShowDeleteModal(r)}
                              className="rounded p-1 text-gray-500 hover:text-red-600"
                              title="Delete Role"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-14 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada role yang ditemukan</p>
            </div>
          )}
        </div>

        {/* ===== Mobile Cards ===== */}
        <div className="space-y-4 md:hidden">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada role yang ditemukan</p>
            </div>
          ) : (
            filtered.map((r) => {
              const perms = r.permissions ?? [];
              return (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium border ${
                          ROLE_COLORS[r.name] || ROLE_COLORS.default
                        }`}
                      >
                        {r.display_name ?? r.name}
                      </span>
                      <p className="mt-1 font-mono text-xs text-gray-500">{r.name}</p>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      {(r.canEdit ?? true) && (
                        <button
                          onClick={() => onEdit(r.id)}
                          className="rounded p-2 text-gray-500 hover:text-indigo-600"
                          title="Edit Role"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      )}
                      {(r.canDelete ?? true) && (
                        <button
                          onClick={() => setShowDeleteModal(r)}
                          className="rounded p-2 text-gray-500 hover:text-red-600"
                          title="Delete Role"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {r.description && (
                    <p className="mb-4 text-sm text-gray-600">{r.description}</p>
                  )}

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Guard</p>
                        <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          {r.guard_name ?? "web"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Users</p>
                        <span className="text-sm font-medium text-gray-900">
                          {r.userCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <button
                      onClick={() => setShowPermsFor(r.id)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 transition-colors hover:bg-indigo-100"
                    >
                      <Key className="h-4 w-4" />
                      {perms.includes("*") ? "All" : perms.length} permissions
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-xs text-gray-500">
                    <div>Created: {fmtDate(r.created_at)}</div>
                    {r.updated_at && r.updated_at !== r.created_at && (
                      <div>Updated: {fmtDate(r.updated_at)}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== Permissions Modal ===== */}
      {showPermsFor !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">
                Permissions –{" "}
                {(items.find((r) => r.id === showPermsFor)?.display_name ??
                  items.find((r) => r.id === showPermsFor)?.name ??
                  "")}
              </h3>
              <button
                onClick={() => setShowPermsFor(null)}
                className="rounded p-1 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto px-6 py-6">
              {(() => {
                const role = items.find((r) => r.id === showPermsFor);
                const perms = role?.permissions ?? [];
                if (perms.includes("*")) {
                  return (
                    <div className="py-8 text-center">
                      <Crown className="mx-auto mb-3 h-8 w-8 text-yellow-500" />
                      <p className="text-lg font-medium text-gray-900">Super Admin</p>
                      <p className="text-gray-600">Memiliki akses penuh ke seluruh sistem</p>
                    </div>
                  );
                }
                if (!perms.length) {
                  return (
                    <p className="text-center text-gray-500">
                      Role ini belum memiliki permissions.
                    </p>
                  );
                }
                return (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {perms.map((p) => (
                      <div key={p} className="flex items-center gap-2 rounded bg-gray-50 p-2">
                        <Key className="h-4 w-4 text-indigo-600" />
                        <span className="font-mono text-sm">{p}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation ===== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.334-.213 2.993-1.742 2.993H3.48c-1.53 0-2.492-1.659-1.743-2.993L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-7a1 1 0 00-1 1v3a1 1 0 002 0V8a1 1 0 00-1-1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Role</h3>
                <p className="text-gray-600">
                  Delete this role "{showDeleteModal.display_name ?? showDeleteModal.name}" ?
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    ROLE_COLORS[showDeleteModal.name] ||
                    "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  {showDeleteModal.display_name ?? showDeleteModal.name}
                </span>
                <span className="text-gray-600">
                  ({showDeleteModal.userCount ?? 0} users)
                </span>
              </div>
              {showDeleteModal.description && (
                <p className="mt-2 text-sm text-gray-600">{showDeleteModal.description}</p>
              )}
            </div>

            <div className="mb-6 text-sm text-gray-600">
              <p className="mb-1 font-medium">Warning:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>This action cannot be undone</li>
                <li>Users with this role will lose associated permissions</li>
                <li>All role assignments will be removed</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={doDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete Role
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}