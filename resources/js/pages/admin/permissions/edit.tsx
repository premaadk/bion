import React from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import permissionsRoutes from "@/routes/admin/permissions";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import { KeySquare as Key, Plus, Users2, Table2, KeyRound } from "lucide-react";

/* ============ Types ============ */
type Id = string | number;
type PermissionDto = {
  id: Id;
  name: string;
  display_name?: string | null;
  description?: string | null;
  guard_name?: string | null;
  category?: string | null;
};
type PageProps = { permission: PermissionDto };

type WF = {
  index: { url: () => string };
  create: { url: () => string };
  edit: { url: (p: { permission: number }) => string };
  update: { url: (p: { permission: number }) => string };
  destroy?: { url: (p: { permission: number }) => string };
  assign?: {
    roles?: { url: () => string };
    users?: { url: () => string };
  };
};
const routes = permissionsRoutes as unknown as WF;

const toInt = (v: Id): number => (typeof v === "number" ? v : parseInt(String(v), 10));

function toSlugFromDisplayName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "-");
}

/* ============ Page ============ */
export default function Edit() {
  const { props, url } = usePage<PageProps>();
  const p = (props as any).permission as PermissionDto;

  const { data, setData, processing, put, errors } = useForm({
    name: p?.name ?? "",
    display_name: p?.display_name ?? "",
    description: p?.description ?? "",
    guard_name: p?.guard_name ?? "web",
    category: p?.category ?? "",
  });

  const isIndex =
    url.startsWith("/admin/permissions") &&
    !url.includes("/create") &&
    !url.includes("/assign") &&
    !/\/edit($|\/)/.test(url);
  const isAssignRoles = url.includes("/permissions/assign-to-roles");
  const isAssignUsers = url.includes("/permissions/assign-for-user");
  const isCreateOrEdit = /\/permissions\/\d+\/edit/.test(url) || url.includes("/permissions/create");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(routes.update.url({ permission: toInt(p.id) }), {
      preserveScroll: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Edit Permission" />

      <PageHero
        badge={{ text: "Edit Permission", icon: <Key className="h-4 w-4" /> }}
        title="Perbarui Permission"
        description="Ubah display name, guard, dan metadata. Slug terbuat otomatis dari Display Name."
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
        stats={[{ value: 1, label: "Permissions", icon: <KeyRound className="h-5 w-5" /> }]}
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
                isCreateOrEdit ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium leading-tight">Edit</span>
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
            <Key className="h-5 w-5" />
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
            Edit Permissions
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={data.display_name}
              onChange={(e) => {
                const v = e.target.value;
                setData("display_name", v);
                setData("name", toSlugFromDisplayName(v));
              }}
              placeholder="e.g. Article Approve"
            />
            {errors.display_name && <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium mb-2">
              Permission Name (slug)
            </label>
            <input
              id="slug"
              type="text"
              disabled
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 px-3 text-sm text-gray-600"
              value={data.name}
              placeholder="auto generated"
            />
            <p className="text-xs text-gray-500 mt-1">Terbentuk otomatis dari Display Name. Spasi → titik.</p>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={data.description}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="Deskripsi permission… (opsional)"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Jika kolom <span className="font-medium">description</span> belum ada pada tabel permissions Spatie, Anda bisa
              menambahkan kolom tersebut atau membuat tabel metadata terpisah (mis. <code>permission_details</code>).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Guard Name</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.guard_name}
                onChange={(e) => setData("guard_name", e.target.value)}
              >
                {["web", "api", "admin"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.guard_name && <p className="mt-1 text-sm text-red-600">{errors.guard_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category (opsional)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={data.category}
                onChange={(e) => setData("category", e.target.value)}
                placeholder="Article / User / Media…"
              />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center justify-center rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {processing ? "Saving…" : "Update"}
            </button>
            <Link href={routes.index.url()} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}