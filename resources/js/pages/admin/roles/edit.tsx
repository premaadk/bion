import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import roles from "@/routes/admin/roles";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import {
  Shield,
  UsersRound,
  Plus,
  ShieldCheck,
  Users,
  KeyRound,
  CheckCircle2,
  Search,
} from "lucide-react";

type Permission = { name: string; label?: string };
type RolePayload = { id: number | string; name: string; permissions: string[] };

type PageProps = {
  role: RolePayload;
  permissions: Permission[];
};

type FormData = { name: string; permissions: string[] };

// Longgarkan typing wayfinder agar aman dipakai di TS
type WFRolesLoose = {
  index: { url: () => string };
  assign: { url: () => string };
  create: { url: () => string };
  update: { url: (p: { role: number }) => string } | ((id: number) => string);
};

export default function Edit({ role, permissions }: PageProps) {
  const { url } = usePage();

  const wf = roles as unknown as WFRolesLoose;

  // --- useForm + HYDRATE dari props role ---
  const { data, setData, put, processing, errors, wasSuccessful, reset } =
    useForm<FormData>({ name: "", permissions: [] });

  useEffect(() => {
    setData("name", role?.name ?? "");
    setData(
      "permissions",
      Array.isArray(role?.permissions) ? role.permissions : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role?.id]);

  // ---- stats hero ----
  const totalPerms = permissions.length;
  const selectedPerms = data.permissions.length;

  // ---- tabs ----
  const isIndex =
    url.startsWith("/admin/roles") &&
    !url.includes("/assign") &&
    !url.includes("/create") &&
    !/\/edit($|\/)/.test(url);
  const isAssign = url.includes("/admin/roles/assign");
  const isCreateOrEdit =
    url.includes("/admin/roles/create") ||
    /\/admin\/roles\/[^/]+\/edit/.test(url);
  const isEditPage = /\/admin\/roles\/[^/]+\/edit/.test(url);

  // ---- search permission ----
  const [permQuery, setPermQuery] = useState("");
  const filteredPerms = useMemo(() => {
    const q = permQuery.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.label ?? "").toLowerCase().includes(q)
    );
  }, [permissions, permQuery]);

  const togglePerm = (perm: string) => {
    setData((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      };
    });
  };

  // ---- submit (perbaiki tipe parameter route) ----
  const roleIdNum = Number(role.id); // pastikan number sesuai typing wayfinder
  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    // Support dua kemungkinan signature: (params) atau (id)
    // @ ts-expect-error — dukung kedua bentuk tanpa ribut TS
    const updateUrl =
      typeof wf.update === "function"
        ? // bentuk: update.url(id) -> tidak umum tapi jaga-jaga
          (wf.update as unknown as (id: number) => string)(roleIdNum)
        : (wf.update as { url: (p: { role: number }) => string }).url({
            role: roleIdNum,
          });

    put(updateUrl, {
      preserveScroll: true,
      onSuccess: () => reset(), // optional
    });
  };

  return (
    <AppLayout>
      <Head title="Edit Role" />

      <PageHero
        badge={{ text: "Kelola Peran", icon: <ShieldCheck className="h-4 w-4" /> }}
        title={`Edit Role: ${role.name}`}
        description="Perbarui nama role dan permissions yang dimiliki."
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
          { value: 1, label: "Form", icon: <ShieldCheck className="h-5 w-5" /> },
          { value: totalPerms, label: "Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: selectedPerms, label: "Selected", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      {/* CONTENT WRAPPER */}
      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* Tabs — Mobile segmented */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isIndex ? "page" : undefined}
            >
              <Shield className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Roles</span>
            </Link>
            <Link
              href={wf.assign.url()}
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isAssign ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isAssign ? "page" : undefined}
            >
              <UsersRound className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">Assign</span>
            </Link>
            <Link
              href="#"
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isCreateOrEdit ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isCreateOrEdit ? "page" : undefined}
            >
              <Plus className="h-5 w-5" />
              {/* ← di mobile, ketika sedang edit tampilkan "Edit" */}
              <span className="text-xs font-medium leading-tight">
                "Edit"
              </span>
            </Link>
          </div>
        </div>

        {/* Tabs — Desktop full buttons */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={wf.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Shield className="h-5 w-5" />
            Roles Management
          </Link>
          <Link
            href={wf.assign.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isAssign ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <UsersRound className="h-5 w-5" />
            User Assignment
          </Link>
          <Link
            href="#"
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            {/* ← di desktop, ketika sedang edit tampilkan "Edit Role" */}
            Edit Role
          </Link>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={submit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
        >
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={data.name}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="e.g. Editor Rubrik"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Permissions */}
          <fieldset className="rounded-xl border border-gray-200">
            <legend className="px-3 py-2 text-sm font-medium">
              Permissions
            </legend>

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
                {filteredPerms.map((perm) => (
                  <label key={perm.name} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.permissions.includes(perm.name)}
                      onChange={() => togglePerm(perm.name)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">{perm.label ?? perm.name}</span>
                  </label>
                ))}
                {filteredPerms.length === 0 && (
                  <p className="text-sm text-gray-500">No permissions found.</p>
                )}
              </div>

              {errors.permissions && (
                <p className="mt-2 text-sm text-red-600">{errors.permissions}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Selected: {selectedPerms}
              </p>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center justify-center rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Saving..." : "Save changes"}
            </button>
            <Link
              href={wf.index.url()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </Link>
            {wasSuccessful && (
              <span className="text-sm text-green-700">Saved.</span>
            )}
          </div>
        </form>
      </div>
    </AppLayout>
  );
}