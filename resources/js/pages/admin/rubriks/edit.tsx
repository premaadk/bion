import React from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import rubriksRoutes from "@/routes/admin/rubriks";
import { Layers, Plus } from "lucide-react";

type Rubrik = { id: number | string; name: string; slug: string; description?: string | null };
type PageProps = { rubrik: Rubrik };

/** slug: spasi -> ".", karakter non a-z0-9 diganti ".", rapikan titik ganda */
const slugifyDot = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");

/** Wayfinder longgar */
type WFRubriks = {
  index: { url: () => string };
  create: { url: () => string };
  update: { url: (p: { rubrik: number } | { id: number }) => string };
};
const wf = rubriksRoutes as unknown as WFRubriks;

/** Normalisasi id ke objek parameter yang diterima .url(...) */
const toParam = (id: number | string) => ({ rubrik: Number(id) }) as any;

export default function Edit() {
  const { url, props } = usePage<PageProps>() as any;
  const r = (props as PageProps).rubrik;

  const { data, setData, put, processing, errors } = useForm({
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
  });

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    put(wf.update.url(toParam(r.id)), { preserveScroll: true });
  };

  const isIndex = url.startsWith("/admin/rubriks") && !/\/create|\/edit/.test(url);
  const isCreateOrEdit = /\/rubriks\/\d+\/edit/.test(url) || /\/rubriks\/create/.test(url);

  return (
    <AppLayout>
      <Head title="Edit Rubrik" />
      <PageHero
        badge={{ text: "Rubriks", icon: <Layers className="h-4 w-4" /> }}
        title="Edit Rubrik"
        description="Perbarui informasi rubrik."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[{ value: 1, label: "Editing", icon: <Plus className="h-5 w-5" /> }]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* Mobile tabs */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-[12px] font-medium ${
                isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <Layers className="h-5 w-5 mb-1" />
              <span>Rubriks</span>
            </Link>
            <Link
              href="#"
              className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-[12px] font-medium ${
                isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span>Edit</span>
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
            <Layers className="h-5 w-5" />
            Management Rubriks
          </Link>
          <Link
            href="#"
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            Edit Rubrik
          </Link>
        </div>

        {/* Form Card */}
        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6 max-w-7xl">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Rubrik</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => {
                const v = e.target.value;
                setData("name", v);
                setData("slug", slugifyDot(v)); // ← selalu sinkron
              }}
              placeholder="e.g., Teknologi"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-gray-300"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug (otomatis)</label>
            <input
              type="text"
              value={data.slug}
              disabled
              readOnly
              placeholder="teknologi"
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 px-3 text-sm text-gray-700 cursor-not-allowed"
            />
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi (opsional)</label>
            <textarea
              rows={3}
              value={data.description ?? ""}
              onChange={(e) => setData("description", e.target.value)}
              placeholder="Keterangan rubrik…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-gray-300"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={processing} className="rounded bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {processing ? "Saving…" : "Update"}
            </button>
            <Link href={wf.index.url()} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}