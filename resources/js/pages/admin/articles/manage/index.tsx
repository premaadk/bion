import React, { useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import articles from "@/routes/admin/articles";
import { ShieldCheck, Search, CheckCircle2 } from "lucide-react";

type Row = {
  id: number | string;
  title: string;
  status: string;
  rubrik?: string | null;
  author?: string | null;
  updated_at?: string | null;
};
type PageProps = {
  articles: Row[];
  labels: Record<string,string>;
};

export default function ManageIndex() {
  const { props } = usePage<PageProps>() as any;
  const p = props as PageProps;

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (p.articles ?? []).filter((a) => !t || a.title.toLowerCase().includes(t) || (a.author ?? "").toLowerCase().includes(t));
  }, [p.articles, q]);

  return (
    <AppLayout>
      <Head title="Management Article" />
      <PageHero
        badge={{ text: "Approval", icon: <ShieldCheck className="h-4 w-4" /> }}
        title="Management Article"
        description="Tinjau, minta revisi, setujui, atau publish sesuai kewenangan."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: p.articles.length, label: "Total", icon: <CheckCircle2 className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-10">
        <div className="mb-6 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Cari judul/author…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={articles.manage.show.url({ article: a.id })}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500">
                    {a.rubrik ?? "—"} • {p.labels[a.status] ?? a.status} • by {a.author ?? "—"}
                  </div>
                </div>
                <div className="text-xs text-gray-500">{a.updated_at ?? "—"}</div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-gray-500">Tidak ada artikel untuk ditampilkan.</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
