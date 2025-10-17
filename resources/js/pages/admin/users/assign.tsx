// resources/js/pages/admin/users/assign.tsx
import React, { useMemo, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import usersRoutes from "@/routes/admin/users";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import {
  Users as UsersIcon,
  UsersRound,
  Plus,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Search,
} from "lucide-react";

/* ====================== Types ====================== */
type Id = number | string;

type Option = { id: Id; name: string };

type UserDTO = {
  id: Id;
  name: string;
  email: string;
  role?: string | null;
  rubrik_id?: Id | null;
  division_id?: Id | null;
  direct_permissions: string[];
};

type PageProps = {
  user: UserDTO;
  roles: Option[];
  permissions: Option[]; // {id,name}
  rubriks: Option[];
  divisions: Option[];
  totals?: { roles?: number; permissions?: number };
};

/* ====================== Wayfinder (longgar) ====================== */
type WFUsers = {
  index: { url: () => string };
  create: { url: () => string };
  // POST assign single user
  assign: { url: (p: { user: Id } | { id: Id }) => string };
};
const wf = usersRoutes as unknown as WFUsers;

/* ====================== Page ====================== */
export default function Assign() {
  const { url, props } = usePage<PageProps>() as any;
  const p = props as PageProps;

  // ----- form -----
  const { data, setData, post, processing, errors } = useForm<{
    role: string;
    rubrik_id: string | "";
    division_id: string | "";
    direct_permissions: string[];
  }>({
    role: p.user.role ?? "",
    rubrik_id: p.user.rubrik_id ? String(p.user.rubrik_id) : "",
    division_id: p.user.division_id ? String(p.user.division_id) : "",
    direct_permissions: [...(p.user.direct_permissions ?? [])],
  });

  // ----- permission filter -----
  const [permQuery, setPermQuery] = useState("");
  const filteredPerms = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return p.permissions;
    return p.permissions.filter((x) => x.name.toLowerCase().includes(q));
  }, [permQuery, p.permissions]);

  const togglePerm = (name: string, checked: boolean) => {
    const prev = Array.isArray(data.direct_permissions) ? data.direct_permissions : [];
    const exists = prev.includes(name);

    const next = checked
      ? (exists ? prev : [...prev, name])
      : prev.filter((v) => v !== name);

    setData("direct_permissions", next);
  };


  // ----- rubrik rules -----
  const roleLower = (data.role || "").toLowerCase();
  const needsRubrik = roleLower === "admin rubrik" || roleLower === "editor rubrik";
  const mustNullRubrik = roleLower === "super admin" || roleLower === "author";

  // ----- tabs (match roles/*) -----
  const isIndex = url.startsWith("/admin/users") && !/\/(create|assign|edit)/.test(url);
  const isAssign = /\/admin\/users\/\d+\/assign/.test(url);
  const isCreateOrEdit = /\/admin\/users\/create|\/admin\/users\/\d+\/edit/.test(url);

  // ----- hero stats -----
  const totalRoles = p.totals?.roles ?? p.roles.length;
  const totalPerms = p.totals?.permissions ?? p.permissions.length;
  const selectedPerms = data.direct_permissions.length;

  // ----- submit -----
  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    const param = { user: p.user.id } as any; // wayfinder biasanya pakai { user: id }
    post(wf.assign.url(param), { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title="Assign User" />

      <PageHero
        badge={{ text: "Users", icon: <UsersIcon className="h-4 w-4" /> }}
        title={`Assign – ${p.user.name}`}
        description="Tetapkan role, rubrik/divisi, dan direct permissions untuk pengguna ini."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: totalRoles, label: "Total Roles", icon: <ShieldCheck className="h-5 w-5" /> },
          { value: totalPerms, label: "Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: selectedPerms, label: "Selected", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      {/* CONTENT */}
      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* Mobile tabs */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <UsersIcon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Users</span>
            </Link>
            <Link
              href="#"
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isAssign ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900"
              }`}
            >
              <UsersRound className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Assign</span>
            </Link>
            <Link
              href={wf.create.url()}
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isCreateOrEdit ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Create</span>
            </Link>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={wf.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UsersIcon className="h-5 w-5" />
            Users Management
          </Link>
          <Link
            href="#"
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssign ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200"
            }`}
          >
            <UsersRound className="h-5 w-5" />
            Assign User
          </Link>
          <Link
            href={wf.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            Create User
          </Link>
        </div>

        {/* FORM CARD */}
        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 max-w-7xl">
          {/* User card */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{p.user.name}</span> — {p.user.email}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              value={data.role}
              onChange={(e) => setData("role", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">— Pilih role —</option>
              {p.roles.map((r) => (
                <option key={String(r.id)} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>

          {/* Rubrik */}
          <div>
            <label className="mb-1 block text-sm font-medium">Rubrik</label>
            <select
              value={data.rubrik_id}
              onChange={(e) => setData("rubrik_id", e.target.value)}
              disabled={mustNullRubrik}
              className={`w-full rounded-lg border py-2 px-3 text-sm outline-none ring-0 ${
                mustNullRubrik
                  ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                  : "border-gray-200 bg-gray-50 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              }`}
            >
              <option value="">
                {mustNullRubrik
                  ? "Harus kosong untuk Super Admin/Author"
                  : needsRubrik
                  ? "Pilih rubrik (wajib)"
                  : "Pilih rubrik (opsional)"}
              </option>
              {p.rubriks.map((r) => (
                <option key={String(r.id)} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.rubrik_id && <p className="mt-1 text-sm text-red-600">{errors.rubrik_id}</p>}
          </div>

          {/* Division */}
          <div>
            <label className="mb-1 block text-sm font-medium">Division</label>
            <select
              value={data.division_id}
              onChange={(e) => setData("division_id", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Pilih division (opsional)</option>
              {p.divisions.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.division_id && <p className="mt-1 text-sm text-red-600">{errors.division_id}</p>}
          </div>

          {/* Direct Permissions */}
          <fieldset className="rounded-xl border border-gray-200">
            <legend className="px-3 py-2 text-sm font-medium">Direct Permissions</legend>

            <div className="px-3 pb-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                  placeholder="Cari permission…"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid max-h-72 grid-cols-1 gap-x-6 gap-y-2 overflow-y-auto sm:grid-cols-2">
                {filteredPerms.map((perm) => {
                  const checked = data.direct_permissions.includes(perm.name);
                  return (
                    <label key={String(perm.id)} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={checked}
                        onChange={(e) => togglePerm(perm.name, e.currentTarget.checked)}
                      />
                      <span className="text-sm">{perm.name}</span>
                    </label>
                  );
                })}
                {filteredPerms.length === 0 && (
                  <p className="text-sm text-gray-500">No permissions found.</p>
                )}
              </div>

              {errors.direct_permissions && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.direct_permissions as unknown as string}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">Selected: {selectedPerms}</p>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing || (needsRubrik && !data.rubrik_id)}
              className="inline-flex items-center justify-center rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Saving…" : "Save assignment"}
            </button>
            <Link
              href={wf.index.url()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}