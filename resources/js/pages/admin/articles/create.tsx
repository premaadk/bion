import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import articles from "@/routes/admin/articles";
import { Newspaper, Save } from "lucide-react";

type Option = { id: number | string; name: string };
type PageProps = { rubriks: Option[] };

type FormData = {
  title: string;
  rubrik_id: number | null;
  excerpt: string;
  content: string;
};

export default function Create(p: PageProps) {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    title: "",
    rubrik_id: null,
    excerpt: "",
    content: "",
  });

  const submit: React.FormEventHandler = (e) => {
    e.preventDefault();
    post(articles.store.url(), { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title="Create Article" />
      <PageHero
        badge={{ text: "Articles", icon: <Newspaper className="h-4 w-4" /> }}
        title="Buat Draft Artikel"
        description="Simpan sebagai draft. Ajukan review nanti dari halaman daftar."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
      />

      <div className="container mx-auto max-w-5xl px-4 pt-6 pb-10">
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={data.title}
              onChange={(e) => setData("title", e.target.value)}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Rubrik</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={data.rubrik_id ?? ""}
              onChange={(e) => setData("rubrik_id", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— Pilih rubrik —</option>
              {p.rubriks.map((r) => <option key={r.id} value={Number(r.id)}>{r.name}</option>)}
            </select>
            {errors.rubrik_id && <p className="mt-1 text-sm text-red-600">{errors.rubrik_id}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Excerpt</label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              value={data.excerpt}
              onChange={(e) => setData("excerpt", e.target.value)}
            />
            {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea
              rows={10}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              value={data.content}
              onChange={(e) => setData("content", e.target.value)}
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <Link
              href={articles.index.url()}
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
