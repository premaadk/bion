import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import usersRoutes from "@/routes/admin/users";
import {
  Users,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  KeyRound,
  Layers,
  Building2,
  CalendarClock,
  UserRound,
  Users as UsersIconMain,
  UserCog,
  UserPlus,
} from "lucide-react";

/* =============== Types =============== */
type Id = string | number;

type UserRow = {
  id: Id;
  name: string;
  email: string;
  role?: string | null;
  rubrik?: string | null;
  division?: string | null;
  direct_permissions: string[];
  created_at?: string | null;
  updated_at?: string | null;
};

type Totals = {
  roles?: number;
  permissions?: number;
  rubriks?: number;
  divisions?: number;
};

type PageProps = {
  users: UserRow[];
  roles: { id: Id; name: string }[];
  totals?: Totals;
};

/** Wayfinder: WAJIB punya bulkAssignRole */
type WFUsers = {
  index: { url: () => string };
  create: { url: () => string };
  edit: { url: (p: { user: Id }) => string };
  destroy: { url: (p: { user: Id }) => string };
  assign: { url: (p: { user: Id }) => string };
  bulkAssignRole: { url: () => string };
};
const wf = usersRoutes as unknown as WFUsers;

/* =============== Helpers =============== */
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

/* =============== Page =============== */
export default function Index() {
  const { url, props } = usePage<PageProps>() as any;
  const items = (props as PageProps).users ?? [];
  const roleList = (props as PageProps).roles ?? [];
  const totals = (props as PageProps).totals ?? {};

  // ---- Stats ----
  const totalUsers = items.length;
  const totalRoles = totals.roles ?? 0;
  const totalPerms = totals.permissions ?? 0;

  // ---- Filters & bulk ----
  const [searchTerm, setSearchTerm] = useState("");
  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((u) => u.role).filter(Boolean) as string[])
      ).sort(),
    [items]
  );
  const rubrikOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((u) => u.rubrik).filter(Boolean) as string[])
      ).sort(),
    [items]
  );
  const divisionOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((u) => u.division).filter(Boolean) as string[])
      ).sort(),
    [items]
  );

  const [roleFilter, setRoleFilter] = useState<string>("");
  const [rubrikFilter, setRubrikFilter] = useState<string>("");
  const [divisionFilter, setDivisionFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return items.filter((u) => {
      const matchesSearch =
        !t ||
        u.name.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) ||
        (u.role ?? "").toLowerCase().includes(t) ||
        (u.rubrik ?? "").toLowerCase().includes(t) ||
        (u.division ?? "").toLowerCase().includes(t);
      const byRole = !roleFilter || (u.role ?? "") === roleFilter;
      const byRubrik = !rubrikFilter || (u.rubrik ?? "") === rubrikFilter;
      const byDivision =
        !divisionFilter || (u.division ?? "") === divisionFilter;
      return matchesSearch && byRole && byRubrik && byDivision;
    });
  }, [items, searchTerm, roleFilter, rubrikFilter, divisionFilter]);

  // Bulk assign
  const [selected, setSelected] = useState<Id[]>([]);
  const [bulkRole, setBulkRole] = useState<string>("");

  const toggleSelect = (id: Id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((u) => u.id));
  };

  const doBulkAssign = () => {
    if (!bulkRole || selected.length === 0) return;
    // WAJIB wayfinder
    const url = wf.bulkAssignRole.url();
    router.post(
      url,
      { role: bulkRole, user_ids: selected },
      { preserveScroll: true }
    );
  };

  // Tabs
  const isIndex =
    url.startsWith("/admin/users") && !/\/create|\/edit/.test(url);
  const isCreate = /\/admin\/users\/create/.test(url);

  return (
    <AppLayout>
      <Head title="Management Users" />

      <PageHero
        badge={{ text: "Kelola Pengguna", icon: <Users className="h-4 w-4" /> }}
        title="Manajemen Pengguna"
        description="Kelola pengguna, peran, dan akses dengan mudah."
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
          { value: totalUsers, label: "Total Users", icon: <Users className="h-5 w-5" /> },
          { value: totalRoles, label: "Total Roles", icon: <UserRound className="h-5 w-5" /> },
          { value: totalPerms, label: "Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* ===== View Selector — Mobile ===== */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex
                  ? "bg-[#1f3b8a] text-white"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isIndex ? "page" : undefined}
            >
              <UsersIconMain className="h-5 w-5" />
              <span className="text-xs font-medium">Users</span>
            </Link>

            {/* Assign tab (disabled pada index – tidak ada konteks user) */}
            <span
              aria-disabled
              className="flex flex-col items-center justify-center gap-1 border-l py-3 bg-gray-50 text-gray-400 cursor-not-allowed"
              title="Buka Assign dari tombol 'Assign' di tabel user"
            >
              <UserCog className="h-5 w-5" />
              <span className="text-xs font-medium">Assign</span>
            </span>

            <Link
              href={wf.create.url()}
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isCreate
                  ? "bg-[#1f3b8a] text-white"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isCreate ? "page" : undefined}
            >
              <UserPlus className="h-5 w-5" />
              <span className="text-xs font-medium">Create</span>
            </Link>
          </div>
        </div>

        {/* ===== View Selector — Desktop ===== */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={wf.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UsersIconMain className="h-5 w-5" />
            Users Management
          </Link>

          {/* Assign tab (disabled) */}
          <span
            aria-disabled
            className="inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold bg-gray-50 text-gray-400 cursor-not-allowed"
            title="Gunakan tombol Assign pada setiap user"
          >
            <UserCog className="h-5 w-5" />
            Assign User
          </span>

          <Link
            href={wf.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreate
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UserPlus className="h-5 w-5" />
            Create User
          </Link>
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama/email/role…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              <option value="">Semua Role</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={rubrikFilter}
              onChange={(e) => setRubrikFilter(e.target.value)}
              aria-label="Filter by rubrik"
            >
              <option value="">Semua Rubrik</option>
              {rubrikOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              aria-label="Filter by division"
            >
              <option value="">Semua Division</option>
              {divisionOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk assign */}
          {/* <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.length === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="h-4 w-4"
                aria-label="Select all"
              />
              <span className="text-sm text-gray-700">
                {selected.length} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 md:w-64"
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
              >
                <option value="">Pilih role…</option>
                {roleList.map((r) => (
                  <option key={r.id as any} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                onClick={doBulkAssign}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={!bulkRole || selected.length === 0}
              >
                Terapkan ke yang dipilih
              </button>
            </div>
          </div> */}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-medium text-gray-700">User</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Email</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Role</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Rubrik</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Division</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Created</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selected.includes(u.id)}
                          onChange={() => toggleSelect(u.id)}
                        />
                        <div className="font-medium text-gray-900">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.role ? (
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          {u.role}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        <Layers className="h-3.5 w-3.5" /> {u.rubrik ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        <Building2 className="h-3.5 w-3.5" /> {u.division ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarClock className="h-4 w-4 text-gray-400" />
                        {fmtDate(u.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={wf.assign.url({ user: u.id })}
                          className="rounded px-2 py-1 text-sm text-indigo-700 hover:bg-indigo-50"
                        >
                          Assign
                        </Link>
                        <Link
                          href={wf.edit.url({ user: u.id })}
                          className="rounded p-1 text-gray-500 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() =>
                            router.delete(wf.destroy.url({ user: u.id }), {
                              preserveScroll: true,
                              preserveState: true,
                            })
                          }
                          className="rounded p-1 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-14 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada user.</p>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada user.</p>
            </div>
          ) : (
            filtered.map((u) => (
              <div key={u.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-gray-900">{u.name}</div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {u.role && (
                        <span className="rounded bg-gray-100 px-2 py-1 font-medium text-gray-800">
                          {u.role}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        <Layers className="h-3.5 w-3.5" /> {u.rubrik ?? "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        <Building2 className="h-3.5 w-3.5" /> {u.division ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <Link
                      href={wf.assign.url({ user: u.id })}
                      className="rounded px-2 py-1 text-sm text-indigo-700 hover:bg-indigo-50"
                    >
                      Assign
                    </Link>
                    <Link
                      href={wf.edit.url({ user: u.id })}
                      className="rounded p-2 text-gray-500 hover:text-indigo-600"
                      title="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() =>
                        router.delete(wf.destroy.url({ user: u.id }), {
                          preserveScroll: true,
                          preserveState: true,
                        })
                      }
                      className="rounded p-2 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2 text-xs text-gray-500">
                  Created: {fmtDate(u.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}