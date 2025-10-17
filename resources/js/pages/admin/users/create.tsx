import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import usersRoutes from "@/routes/admin/users";
import {
  Users as UsersIcon,
  UserPlus,
  KeyRound,
  CheckCircle2,
  Search,
  Layers,
  Building2,
  UserCog,
} from "lucide-react";

/* =============== Types =============== */
type Option = { id: number | string; name: string };

type PageProps = {
  roles: Option[];
  permissions: Option[]; // {id,name}
  rubriks: Option[];
  divisions: Option[];
};

type FormData = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;                 // nama role
  direct_permissions: string[]; // nama permission
  rubrik_id: number | null;
  division_id: number | null;
};

/** Longgarkan typing wayfinder */
type WFUsers = {
  index: { url: () => string };
  create: { url: () => string };
  store: { url: () => string };
};
const wf = usersRoutes as unknown as WFUsers;

/* =============== Page =============== */
export default function Create(props: PageProps) {
  const { url } = usePage();

  const { data, setData, post, processing, errors, transform } = useForm<FormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "", // ← kosong = default "Author" saat submit
    direct_permissions: [] as string[],
    rubrik_id: null,
    division_id: null,
  });

  // ---- Stats untuk hero ----
  const totalRoles = props.roles.length;
  const totalPerms = props.permissions.length;
  const selectedPerms = data.direct_permissions.length;

  // ---- Tabs (konsisten) ----
  const isIndex = url.startsWith("/admin/users") && !/\/create|\/edit/.test(url);
  const isCreate = /\/admin\/users\/create/.test(url);

  // ---- Search permissions ----
  const [permQuery, setPermQuery] = useState("");
  const filteredPerms = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return props.permissions;
    return props.permissions.filter((p) => p.name.toLowerCase().includes(q));
  }, [props.permissions, permQuery]);

  // ---- Permission toggle helper ----
  const togglePermission = (name: string) => {
    const exists = data.direct_permissions.includes(name);
    setData(
      "direct_permissions",
      exists
        ? data.direct_permissions.filter((x) => x !== name)
        : [...data.direct_permissions, name]
    );
  };

  // ===== Role -> aturan Rubrik =====
  const roleName = (data.role || "").trim().toLowerCase();
  const roleForbidsRubrik = roleName === "super admin" || roleName === "author";
  const roleNeedsRubrik = roleName === "admin rubrik" || roleName === "editor rubrik";
  const rubrikDisabled = !data.role || roleForbidsRubrik;

  // Kosongkan rubrik jika role belum dipilih / melarang rubrik
  useEffect(() => {
    if (rubrikDisabled && data.rubrik_id !== null) {
      setData("rubrik_id", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubrikDisabled]);

  // Fokuskan ke rubrik jika wajib namun kosong saat submit
  const rubrikRef = useRef<HTMLSelectElement>(null);

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();

    // Tetapkan default role = "Author" jika kosong
    const effectiveRole = (data.role || "Author").trim();
    const r = effectiveRole.toLowerCase();
    const effectiveNeedsRubrik = r === "admin rubrik" || r === "editor rubrik";
    const effectiveForbidsRubrik = r === "super admin" || r === "author";

    if (effectiveNeedsRubrik && !data.rubrik_id) {
      rubrikRef.current?.focus();
      return;
    }

    // Transform payload sebelum kirim
    transform((payload) => ({
      ...payload,
      role: effectiveRole,
      rubrik_id: effectiveForbidsRubrik ? null : payload.rubrik_id,
    }));

    post(wf.store.url(), { preserveScroll: true });
  };

  // UI helpers
  const rubrikPlaceholder = !data.role
    ? "— Pilih role terlebih dulu (default Author)"
    : roleForbidsRubrik
    ? "— Tidak boleh memilih (Super Admin/Author)"
    : "— Pilih rubrik —";

  const showRubrikRequiredHint = roleNeedsRubrik && !data.rubrik_id;

  return (
    <AppLayout>
      <Head title="Create User" />

      <PageHero
        badge={{ text: "Users", icon: <UsersIcon className="h-4 w-4" /> }}
        title="Buat User Baru"
        description="Tambahkan pengguna, tetapkan peran, rubrik/divisi, dan izin langsung."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: 1, label: "Form", icon: <UserPlus className="h-5 w-5" /> },
          { value: totalRoles, label: "Roles", icon: <UsersIcon className="h-5 w-5" /> },
          { value: totalPerms, label: "Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: selectedPerms, label: "Selected", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* ===== View Selector — Mobile ===== */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center gap-1 py-3 ${isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"}`}
              aria-current={isIndex ? "page" : undefined}
            >
              <UsersIcon className="h-5 w-5" />
              <span className="text-xs font-medium">Users</span>
            </Link>

            {/* Assign tab (disabled) */}
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
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${isCreate ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"}`}
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
              isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UsersIcon className="h-5 w-5" />
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
              isCreate ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UserPlus className="h-5 w-5" />
            Create User
          </Link>
        </div>

        {/* FORM CARD */}
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          {/* Name + Email */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.password}
                onChange={(e) => setData("password", e.target.value)}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.password_confirmation}
                onChange={(e) => setData("password_confirmation", e.target.value)}
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
              )}
            </div>
          </div>

          {/* Role + Rubrik + Division */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Role */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium">Role <span className="text-xs text-gray-500">(kosong = Author)</span></label>
              </div>
              <select
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.role}
                onChange={(e) => setData("role", e.target.value)}
              >
                <option value="">—</option>
                {props.roles.map((r) => (
                  <option key={r.id} value={String(r.name)}>{r.name}</option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            </div>

            {/* Rubrik */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Rubrik {roleNeedsRubrik && <span className="text-red-600">*</span>}
                </label>
                {roleForbidsRubrik && (
                  <span className="text-xs text-gray-500">Dilarang (Super Admin / Author)</span>
                )}
              </div>

              <div className="relative">
                <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  ref={rubrikRef}
                  className={[
                    "w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/20",
                    rubrikDisabled
                      ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                      : "bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300",
                    showRubrikRequiredHint ? "border-red-300 focus:ring-red-400" : ""
                  ].join(" ")}
                  value={data.rubrik_id ?? ""}
                  onChange={(e) => setData("rubrik_id", e.target.value ? Number(e.target.value) : null)}
                  disabled={rubrikDisabled}
                  aria-disabled={rubrikDisabled}
                  required={roleNeedsRubrik}
                >
                  <option value="">{rubrikPlaceholder}</option>
                  {props.rubriks.map((r) => (
                    <option key={r.id} value={Number(r.id)}>{r.name}</option>
                  ))}
                </select>
              </div>

              {errors.rubrik_id && <p className="mt-1 text-sm text-red-600">{errors.rubrik_id}</p>}
              {showRubrikRequiredHint && !errors.rubrik_id && (
                <p className="mt-1 text-sm text-red-600">Role ini mewajibkan memilih rubrik.</p>
              )}
            </div>

            {/* Division */}
            <div>
              <label className="mb-1 block text-sm font-medium">Division (optional)</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  value={data.division_id ?? ""}
                  onChange={(e) => setData("division_id", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">—</option>
                  {props.divisions.map((d) => (
                    <option key={d.id} value={Number(d.id)}>{d.name}</option>
                  ))}
                </select>
              </div>
              {errors.division_id && <p className="mt-1 text-sm text-red-600">{errors.division_id}</p>}
            </div>
          </div>

          {/* Direct permissions */}
          <fieldset className="rounded-xl border border-gray-200">
            <legend className="px-3 py-2 text-sm font-medium">Direct Permissions (optional)</legend>
            <div className="px-3 pb-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari permission…"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  value={permQuery}
                  onChange={(e) => setPermQuery(e.target.value)}
                />
              </div>

              <div className="grid max-h-72 grid-cols-1 gap-x-6 gap-y-2 overflow-y-auto sm:grid-cols-2">
                {filteredPerms.map((perm) => {
                  const checked = data.direct_permissions.includes(perm.name);
                  return (
                    <label key={perm.id} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={checked}
                        onChange={() => togglePermission(perm.name)}
                      />
                      <span className="text-sm">{perm.name}</span>
                    </label>
                  );
                })}
                {filteredPerms.length === 0 && (
                  <p className="text-sm text-gray-500">Permission tidak ditemukan.</p>
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
              disabled={processing}
              className="rounded bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Saving…" : "Create"}
            </button>
            <Link
              href={wf.index.url()}
              className="rounded border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
