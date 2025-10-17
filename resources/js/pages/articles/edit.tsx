import React from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import articles from "@/routes/articles";
import { Newspaper, Save, Send } from "lucide-react";

type Option = { id: number | string; name: string };
type ArticleDTO = {
  id: number | string;
  title: string;
  slug: string;
  status: string;
  rubrik_id: number | null;
  excerpt: string;
  content: string;
};
type PageProps = { article: ArticleDTO; rubriks: Option[] };

export default function Edit() {
  const { props } = usePage<PageProps>() as any;
  const p = props as PageProps;

  const canEdit = ['draft','revision'].includes(p.article.status);

  const { data, setData, put, processing, errors } = useForm({
    title: p.article.title,
    rubrik_id: p.article.rubrik_id,
    excerpt: p.article.excerpt ?? "",
    content: p.article.content ?? "",
  });

  const save: React.FormEventHandler = (e) => {
    e.preventDefault();
    put(articles.update.url({ article: p.article.id }), { preserveScroll: true });
  };

  const submitArticle = () => {
    router.post(articles.submit.url({ article: p.article.id }), {}, { preserveScroll: true });
  };

  return (
    <AppLayout>
      <Head title={`Edit: ${p.article.title}`} />
      <PageHero
        badge={{ text: "Articles", icon: <Newspaper className="h-4 w-4" /> }}
        title={`Edit Draft: ${p.article.title}`}
        description="Hanya bisa diubah saat Draft atau Revision."
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
      />

      <div className="container mx-auto max-w-5xl px-4 pt-6 pb-10">
        <form onSubmit={save} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input
                disabled={!canEdit}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:opacity-60"
                value={data.title}
                onChange={(e) => setData("title", e.target.value)}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rubrik</label>
              <select
                disabled={!canEdit}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm disabled:opacity-60"
                value={data.rubrik_id ?? ""}
                onChange={(e) => setData("rubrik_id", e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">—</option>
                {p.rubriks.map((r) => <option key={r.id} value={Number(r.id)}>{r.name}</option>)}
              </select>
              {errors.rubrik_id && <p className="mt-1 text-sm text-red-600">{errors.rubrik_id}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Excerpt</label>
            <input
              disabled={!canEdit}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:opacity-60"
              value={data.excerpt}
              onChange={(e) => setData("excerpt", e.target.value)}
            />
            {errors.excerpt && <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <textarea
              rows={12}
              disabled={!canEdit}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:opacity-60"
              value={data.content}
              onChange={(e) => setData("content", e.target.value)}
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={processing || !canEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={submitArticle}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" /> Submit
              </button>
            )}
            <Link
              href={articles.index.url()}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
