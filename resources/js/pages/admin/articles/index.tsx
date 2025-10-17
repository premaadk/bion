import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import articles from "@/routes/admin/articles";
import { Users as UsersIcon, Newspaper, Search, Plus, CheckCircle2, Layers, CalendarClock, Edit2, Trash2, Send } from "lucide-react";

type Row = {
  id: number | string;
  title: string;
  status: string;
  rubrik?: string | null;
  updated_at?: string | null;
};
type PageProps = {
  articles: Row[];
  statuses: Record<string,string>;
  rubriks: { id: number | string; name: string }[];
};

export default function Index() {
  const { props } = usePage<PageProps>() as any;
  const p = props as PageProps;

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (p.articles ?? []).filter(a => {
      const bySearch = !t || a.title.toLowerCase().includes(t) || (a.rubrik ?? "").toLowerCase().includes(t);
      const byStatus = !statusFilter || a.status === statusFilter;
      return bySearch && byStatus;
    });
  }, [p.articles, q, statusFilter]);

  const doSubmit = (id: number | string) => {
    router.post(articles.submit.url({ article: id }), {}, { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title="My Articles" />
      <PageHero
        badge={{ text: "Articles", icon: <Newspaper className="h-4 w-4" /> }}
        title="Artikelku (My Article)"
        description="Tulis artikel dalam draft, ajukan untuk ditinjau, dan lihat statusnya."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: p.articles.length, label: "Total", icon: <CheckCircle2 className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-10">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-xl items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Cari judul/rubrik…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="w-44 rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              {Object.entries(p.statuses).map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <Link
            href={articles.create.url()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> New Article
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Rubrik</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">{a.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        <Layers className="h-3.5 w-3.5" /> {a.rubrik ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                        {p.statuses[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarClock className="h-4 w-4 text-gray-400" />
                        {a.updated_at ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={articles.show.url({ article: a.id })}
                          className="rounded px-2 py-1 text-indigo-700 hover:bg-indigo-50"
                        >
                          View
                        </Link>
                        {/* Edit/Delete hanya saat draft/revision */}
                        {['draft','revision'].includes(a.status) && (
                          <>
                            <Link
                              href={articles.edit.url({ article: a.id })}
                              className="rounded p-1 text-gray-600 hover:text-indigo-600"
                              title="Edit"
                            >
                              <Edit2 className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() => router.delete(articles.destroy.url({ article: a.id }), { preserveScroll: true })}
                              className="rounded p-1 text-gray-600 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => doSubmit(a.id)}
                              className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                              title="Submit for review"
                            >
                              <Send className="h-4 w-4" /> Submit
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Tidak ada artikel.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
