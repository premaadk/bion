import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import articles from "@/routes/admin/articles";
import { ShieldCheck } from "lucide-react";

type ArticleDTO = {
  id: number | string;
  title: string;
  status: string;
  rubrik?: string | null;
  author?: string | null;
  excerpt?: string | null;
  content?: string | null;
  published_at?: string | null;
};
type PageProps = {
  article: ArticleDTO;
  labels: Record<string,string>;
};

export default function ManageShow() {
  const { props } = usePage<PageProps>() as any;
  const p = props as PageProps;
  const [note, setNote] = useState("");

  const startEditorReview = () => router.post(articles.review.editor.url({ article: p.article.id }), { note }, { preserveScroll: true });
  const requestRevision  = () => router.post(articles.review.requestRevision.url({ article: p.article.id }), { note }, { preserveScroll: true });
  const approve          = () => router.post(articles.review.approve.url({ article: p.article.id }), { note }, { preserveScroll: true });

  const startAdminReview = () => router.post(articles.review.admin.url({ article: p.article.id }), { note }, { preserveScroll: true });
  const reject           = () => router.post(articles.review.reject.url({ article: p.article.id }), { note }, { preserveScroll: true });
  const publish          = () => router.post(articles.review.publish.url({ article: p.article.id }), { note }, { preserveScroll: true });

  return (
    <AppLayout>
      <Head title={`Manage: ${p.article.title}`} />
      <PageHero
        badge={{ text: "Approval", icon: <ShieldCheck className="h-4 w-4" /> }}
        title={p.article.title}
        description={`${p.labels[p.article.status] ?? p.article.status} • ${p.article.rubrik ?? "—"} • by ${p.article.author ?? "—"}`}
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
      />

      <div className="container mx-auto max-w-5xl px-4 pt-6 pb-10 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6">
          {p.article.excerpt && <p className="mb-4 text-gray-700">{p.article.excerpt}</p>}
          <div className="prose max-w-none">{p.article.content ?? <p className="text-gray-500">Tidak ada konten.</p>}</div>
        </div>

        {/* Action panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 space-y-3">
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            placeholder="Tulis catatan (opsional)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {/* Editor actions */}
            {['submitted','review_editor','revision'].includes(p.article.status) && (
              <>
                <button onClick={startEditorReview} className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white">Set Review (Editor)</button>
                <button onClick={requestRevision} className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white">Request Revision</button>
                <button onClick={approve} className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white">Approve (to Admin)</button>
              </>
            )}

            {/* Admin actions */}
            {['approved','review_admin'].includes(p.article.status) && (
              <>
                <button onClick={startAdminReview} className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white">Set Review (Admin)</button>
                <button onClick={reject} className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white">Reject</button>
                <button onClick={publish} className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white">Publish</button>
              </>
            )}
          </div>

          <div className="pt-2">
            <Link href={articles.manage.index.url()} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              Back to Management
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}