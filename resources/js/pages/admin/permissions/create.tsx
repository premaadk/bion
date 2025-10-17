import React from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import routes from "@/routes/admin/permissions";
import { KeyRound, Plus, Key, Table2, Users2 } from "lucide-react";

const GUARDS = ["web", "api", "admin"] as const;

function toSlugFromDisplayName(s: string): string {
  // trim → lowercase → spasi jadi titik → karakter selain huruf/angka/titik menjadi "-"
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "-");
}

export default function Create() {
  const { url } = usePage();

  const { data, setData, post, processing, errors } = useForm({
    name: "",
    display_name: "",
    description: "",
    guard_name: "web",
    category: "",
  });

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post(routes.store.url());
  };

  const isIndex = url.startsWith("/admin/permissions") && !url.includes("/assign") && url.includes("/create") === false;
  const isAssignRoles = url.includes("/permissions/assign-to-roles");
  const isAssignUsers = url.includes("/permissions/assign-for-user");
  const isCreate = url.includes("/permissions/create");

  return (
    <AppLayout>
      <Head title="Create Permissions" />

      <PageHero
        badge={{ text: "Permissions", icon: <KeyRound className="h-4 w-4" /> }}
        title="Create Permission"
        description="Buat permission baru untuk sistem (Spatie)."
        gradient={{
          from: "#6366f1",
          via: "#7c3aed",
          to: "#8b5cf6",
          direction: "to right",
          overlayOpacity: 0.66,
        }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.18 }}
        stats={[
          { value: "—", label: "Total Permissions", icon: <KeyRound className="h-5 w-5" /> },
          { value: "—", label: "Used By Roles", icon: <Key className="h-5 w-5" /> },
          { value: "—", label: "Form", icon: <Plus className="h-5 w-5" /> },
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
          <Link href={routes.index.url()} className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}>
            <Key className="h-5 w-5" />
            Management Permissions
          </Link>
          <Link href={routes.assign.roles.url()} className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${isAssignRoles ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}>
            <Table2 className="h-5 w-5" />
            Assignment to Roles
          </Link>
          <Link href={routes.assign.users.url()} className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${isAssignUsers ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}>
            <Users2 className="h-5 w-5" />
            Assignment for User
          </Link>
          <Link href={routes.create.url()} className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${isCreate ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"}`}>
            <Plus className="h-5 w-5" />
            Create Permissions
          </Link>
        </div>

        {/* Form Card */}
        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 max-w-3xl">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={data.display_name}
              onChange={(e) => {
                const v = e.target.value;
                setData("display_name", v);
                setData("name", toSlugFromDisplayName(v));
              }}
              placeholder="e.g., Article Approve"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-gray-300"
            />
            {errors.display_name && <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Permission Name (slug)</label>
            <input
              type="text"
              value={data.name}
              disabled
              readOnly
              placeholder="auto generated"
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 px-3 text-sm text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Terbentuk otomatis dari Display Name. Spasi → titik.</p>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="Deskripsi permission… (opsional)"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-gray-300"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Guard Name</label>
              <select
                value={data.guard_name}
                onChange={(e) => setData("guard_name", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-gray-300"
              >
                {GUARDS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.guard_name && <p className="mt-1 text-sm text-red-600">{errors.guard_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category (opsional)</label>
              <input
                type="text"
                value={data.category}
                onChange={(e) => setData("category", e.target.value)}
                placeholder="Article / User / Media…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-gray-300"
              />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing}
              className="rounded bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Saving…" : "Create"}
            </button>
            <Link href={routes.index.url()} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}