import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import divisionsRoutes from "@/routes/admin/divisions";
import {
  GitBranch,
  CheckCircle2,
  KeyRound,
  Search,
  Pencil,
  Trash2,
  CalendarClock,
  Plus,
  Tag,
} from "lucide-react";

/* ====================== Types ====================== */
type Id = string | number;

type Division = {
  id: Id;
  name: string;
  slug: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WFDivisions = {
  index: { url: () => string };
  create: { url: () => string };
  edit: { url: (p: { division: number } | { id: number }) => string };
  destroy: { url: (p: { division: number } | { id: number }) => string };
};
const wf = divisionsRoutes as unknown as WFDivisions;

/** Normalisasi param id sesuai helper .url(...) */
const toParam = (id: Id) => ({ division: Number(id) }) as any;

type PageProps = { divisions: Division[] };

/* ====================== Helpers ====================== */
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
export default function Index() {
  const { url, props } = usePage<PageProps>() as any;
  const items = (props as PageProps).divisions ?? [];

  // Stats
  const totalDivisions = items.length;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return items.filter(
      (d) =>
        !t ||
        d.name.toLowerCase().includes(t) ||
        d.slug.toLowerCase().includes(t) ||
        (d.description ?? "").toLowerCase().includes(t)
    );
  }, [items, searchTerm]);

  // Tabs
  const isIndex = url.startsWith("/admin/divisions") && !/\/create|\/edit/.test(url);
  const isCreateOrEdit = /\/divisions\/create/.test(url) || /\/divisions\/\d+\/edit/.test(url);

  // Actions
  const onEdit = (id: Id) => router.visit(wf.edit.url(toParam(id)));
  const onDelete = (id: Id) =>
    router.delete(wf.destroy.url(toParam(id)), { preserveScroll: true, preserveState: true });

  return (
    <AppLayout>
      <Head title="Management Divisions" />

      <PageHero
        badge={{ text: "Divisions", icon: <GitBranch className="h-4 w-4" /> }}
        title="Manajemen Divisi"
        description="Kelola daftar divisi/struktur organisasi untuk konten & operasional Anda."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: totalDivisions, label: "Total Divisions", icon: <GitBranch className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
          { value: "—", label: "Linked Permissions", icon: <KeyRound className="h-5 w-5" /> },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* Mobile tabs (icon top, label bottom) */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-[12px] font-medium ${
                isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <GitBranch className="h-5 w-5 mb-1" />
              <span>Divisions</span>
            </Link>
            <Link
              href={wf.create.url()}
              className={`flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-[12px] font-medium ${
                isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span>Create</span>
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
            <GitBranch className="h-5 w-5" />
            Management Divisions
          </Link>
          <Link
            href={wf.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreateOrEdit ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            Create Division
          </Link>
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari division / slug…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-medium text-gray-700">Division</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Slug</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Created</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{d.name}</div>
                      {d.description && <div className="mt-1 text-sm text-gray-600">{d.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        <Tag className="h-3.5 w-3.5" /> {d.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarClock className="h-4 w-4 text-gray-400" />
                        {fmtDate(d.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEdit(d.id)}
                          className="rounded p-1 text-gray-500 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onDelete(d.id)}
                          className="rounded p-1 text-gray-500 hover:text-red-600"
                          title="Hapus"
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
              <GitBranch className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada division.</p>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-4 md:hidden">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <GitBranch className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Tidak ada division.</p>
            </div>
          ) : (
            filtered.map((d) => (
              <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-gray-900">{d.name}</div>
                    <div className="mt-1 inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                      <Tag className="h-3.5 w-3.5" /> {d.slug}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <button onClick={() => onEdit(d.id)} className="rounded p-2 text-gray-500 hover:text-indigo-600">
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDelete(d.id)} className="rounded p-2 text-gray-500 hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {d.description && <p className="mb-3 text-sm text-gray-600">{d.description}</p>}
                <div className="border-t border-gray-100 pt-2 text-xs text-gray-500">Created: {fmtDate(d.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}