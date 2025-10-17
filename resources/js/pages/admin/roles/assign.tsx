import React, { useMemo, useState, useEffect } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import roles from "@/routes/admin/roles"; // Wayfinder: index, create, edit, destroy, assign
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import {
  Search,
  Users,
  Shield,
  UsersRound,
  Plus,
  Check,
  Square,
  CheckSquare,
  BadgeInfo,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

/* ====================== Types ====================== */
type Id = string | number;

type RoleOption = {
  id: Id;
  name: string;
  display_name?: string | null;
  guard_name?: string | null;
  /** optional: role custom yang mewajibkan rubrik */
  requires_rubrik?: boolean;
};

type UserRow = {
  id: Id;
  name: string;
  email: string;
  currentRole?: string | null;
  rubrik_id?: string | number | null;
};

type RubrikOption = { id: Id; name: string };

type PageProps = {
  roles: RoleOption[];
  users: UserRow[];
  selectedRoleId?: Id | null;
  /** optional, bila belum disediakan backend tetap aman */
  rubriks?: RubrikOption[];
};

/* ====================== Helpers ====================== */
const toID = (v: string | number) => String(v);

function ensureArray<T = string>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val == null) return [];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as T[];
    }
  }
  return [];
}

/* ====================== Page ====================== */
export default function Assign({
  roles: roleOptions,
  users,
  selectedRoleId = null,
  rubriks = [],
}: PageProps) {
  const { url } = usePage();

  // ---- Form (POST /assign) ----
  const { data, setData, post, processing, errors, reset } = useForm<{
    role_id: string | "";
    user_ids: string[];
    rubrik_id: string | ""; // NEW
  }>({
    role_id: selectedRoleId ? toID(selectedRoleId) : "",
    user_ids: [],
    rubrik_id: "",
  });

  // ---- Local filters (client-side view) ----
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByCurrentRole, setFilterByCurrentRole] = useState<string>(""); // ""=all, "__none__"=no role

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);
      const matchesRole =
        filterByCurrentRole === ""
          ? true
          : filterByCurrentRole === "__none__"
          ? !u.currentRole
          : u.currentRole === filterByCurrentRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterByCurrentRole]);

  // ---- Selection helpers ----
  const selectedIds = ensureArray<string>(data.user_ids);
  const allIds = filteredUsers.map((u) => toID(u.id));
  const selectedCount = selectedIds.length;
  const allChecked =
    filteredUsers.length > 0 && selectedIds.length === filteredUsers.length;

  const toggleUser = (id: Id) => {
    const sid = toID(id);
    setData(
      "user_ids",
      selectedIds.includes(sid)
        ? selectedIds.filter((x) => x !== sid)
        : [...selectedIds, sid]
    );
  };
  const toggleAll = () => setData("user_ids", allChecked ? [] : allIds);
  const clearSelection = () => setData("user_ids", []);

  // ---- Hero stats (konsisten 4 item) ----
  const totalRoles = roleOptions.length;
  const totalUsers = users.length;
  const filteredCount = filteredUsers.length;

  // ---- Tabs (sama seperti index.tsx) ----
  const isIndex =
    url.startsWith("/admin/roles") &&
    !url.includes("/assign") &&
    !url.includes("/create") &&
    !/\/edit($|\/)/.test(url);
  const isAssign = url.includes("/admin/roles/assign");
  const isCreateOrEdit =
    url.includes("/admin/roles/create") ||
    /\/admin\/roles\/[^/]+\/edit/.test(url);

  // ====== Role needs rubrik? ======
  const selectedRole = useMemo(
    () => roleOptions.find((r) => toID(r.id) === data.role_id),
    [roleOptions, data.role_id]
  );
  const needsRubrik = useMemo(() => {
    const nm = (selectedRole?.name || "").toLowerCase();
    return (
      selectedRole?.requires_rubrik === true ||
      nm === "admin rubrik" ||
      nm === "editor rubrik"
    );
  }, [selectedRole]);

  // Jika role tidak butuh rubrik, kosongkan pilihan rubrik
  useEffect(() => {
    if (!needsRubrik && data.rubrik_id) setData("rubrik_id", "");
  }, [needsRubrik]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Submit ----
  const canSubmit =
    !!data.role_id &&
    selectedIds.length > 0 &&
    (!needsRubrik || !!data.rubrik_id) &&
    !processing;

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post(roles.assign.url(), {
      preserveScroll: true,
      onSuccess: () => reset("user_ids"),
    });
  };

  /* ====================== UI ====================== */
  return (
    <AppLayout>
      <Head title="Assign Roles" />

      {/* ===== HERO (seragam) ===== */}
      <PageHero
        badge={{ text: "Kelola Peran", icon: <ShieldCheck className="h-4 w-4" /> }}
        title="Penugasan Peran ke Pengguna"
        description="Tetapkan peran secara massal ke pengguna dengan aman dan cepat."
        gradient={{
          from: "#203b8a",
          via: "#2a4db3",
          to: "#3560dc",
          direction: "to right",
          overlayOpacity: 0.66,
        }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: totalRoles, label: "Total Roles", icon: <ShieldCheck className="h-5 w-5" /> },
          { value: totalUsers, label: "Total Users", icon: <Users className="h-5 w-5" /> },
          { value: selectedCount, label: "Selected", icon: <CheckCircle2 className="h-5 w-5" /> },
          { value: filteredCount, label: "Filtered", icon: <KeyRound className="h-5 w-5" /> },
        ]}
      />

      {/* ====== CONTENT WRAPPER (padding mobile aman dari sticky nav) ====== */}
      <div
        className="
          container mx-auto max-w-7xl
          px-4 pt-6
          pb-[calc(env(safe-area-inset-bottom)+96px)]
          md:pb-8
        "
      >
        {/* ===== View Selector ===== */}
        {/* Mobile segmented (3 kolom) */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Link
              href={roles.index.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isIndex ? "page" : undefined}
            >
              <Shield className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Roles</span>
            </Link>

            <Link
              href={roles.assign.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isAssign ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isAssign ? "page" : undefined}
            >
              <UsersRound className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Assign</span>
            </Link>

            <Link
              href={roles.create.url()}
              className={`col-span-1 flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isCreateOrEdit ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
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
            href={roles.index.url()}
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
            href={roles.assign.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssign
                ? "bg-[#1f3b8a] text-white border-[#1f3b8a]"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
            aria-current={isAssign ? "page" : undefined}
          >
            <UsersRound className="h-5 w-5" />
            User Assignment
          </Link>

          <Link
            href={roles.create.url()}
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

        {/* ===== Form Card ===== */}
        <form
          onSubmit={submit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
        >
          {/* Row: Pilih role untuk di-assign */}
          <div>
            <label htmlFor="role_id" className="mb-2 block text-sm font-medium">
              Role to assign
            </label>
            <select
              id="role_id"
              value={data.role_id}
              onChange={(e) => setData("role_id", e.target.value || "")}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">— Select role —</option>
              {roleOptions.map((r) => (
                <option key={toID(r.id)} value={toID(r.id)}>
                  {r.display_name ?? r.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="mt-1 text-sm text-red-600">{errors.role_id}</p>
            )}
          </div>

          {/* NEW: Dropdown Rubrik (muncul jika role wajib rubrik) */}
          {needsRubrik && (
            <div>
              <label htmlFor="rubrik_id" className="mb-2 block text-sm font-medium">
                Pilih Rubrik
              </label>
              <select
                id="rubrik_id"
                value={data.rubrik_id}
                onChange={(e) => setData("rubrik_id", e.target.value || "")}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">— Pilih rubrik —</option>
                {rubriks.length === 0 ? (
                  <option value="" disabled>
                    (Data rubrik tidak tersedia)
                  </option>
                ) : (
                  rubriks.map((r) => (
                    <option key={toID(r.id)} value={toID(r.id)}>
                      {r.name}
                    </option>
                  ))
                )}
              </select>
              {errors["rubrik_id"] && (
                <p className="mt-1 text-sm text-red-600">{errors["rubrik_id"]}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Role ini mewajibkan rubrik. Pilih rubrik sebelum melakukan assign.
              </p>
            </div>
          )}

          {/* Toolbar filter user */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari user…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={filterByCurrentRole}
              onChange={(e) => setFilterByCurrentRole(e.target.value)}
            >
              <option value="">Semua Role (saat ini)</option>
              <option value="__none__">Tanpa Role</option>
              {roleOptions.map((r) => (
                <option key={toID(r.id)} value={r.name}>
                  {r.display_name ?? r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selection bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                {allChecked ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {allChecked ? "Unselect all (filtered)" : "Select all (filtered)"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedIds.length === 0}
                className="text-sm underline text-gray-700 disabled:opacity-50"
              >
                Clear selection
              </button>
            </div>

            <div className="text-xs text-gray-600">
              {selectedIds.length} selected • {filteredUsers.length} shown of {users.length} users
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="w-12 px-4 py-3"></th>
                    <th className="px-4 py-3 font-medium text-gray-700">User</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Current Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const sid = toID(u.id);
                    const checked = selectedIds.includes(sid);
                    return (
                      <tr key={sid} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => toggleUser(sid)}
                            className="rounded border border-gray-300 p-1 hover:bg-gray-50"
                            aria-pressed={checked}
                          >
                            {checked ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2 text-gray-600">{u.email}</td>
                        <td className="px-4 py-2">
                          {u.currentRole ? (
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs">
                              {u.currentRole}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                        Tidak ada user.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {errors.user_ids && (
              <p className="px-4 py-2 text-sm text-red-600">{errors.user_ids}</p>
            )}
          </div>

          {/* Mobile list */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                Tidak ada user.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const sid = toID(u.id);
                const checked = selectedIds.includes(sid);
                return (
                  <label
                    key={sid}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5"
                      checked={checked}
                      onChange={() => toggleUser(sid)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Current Role: </span>
                        {u.currentRole ? (
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs">
                            {u.currentRole}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
            {errors.user_ids && (
              <p className="text-sm text-red-600">{errors.user_ids}</p>
            )}
          </div>

          {/* Submit bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Assigning…" : "Assign Role"}
            </button>
            <button
              type="button"
              onClick={() => reset("user_ids")}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Reset users
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <BadgeInfo className="h-4 w-4" />
              <span>
                Role <b>Admin Rubrik</b> / <b>Editor Rubrik</b> (atau role yang mewajibkan rubrik)
                hanya bisa diberikan jika rubrik telah dipilih.
              </span>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}