import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import articles from "@/routes/admin/articles";
import { Newspaper } from "lucide-react";

type ArticleDTO = {
  id: number | string;
  title: string;
  status: string;
  rubrik?: string | null;
  excerpt?: string | null;
  content?: string | null;
  published_at?: string | null;
};
type PageProps = {
  article: ArticleDTO;
  labels: Record<string,string>;
};

export default function Show() {
  const { props } = usePage<PageProps>() as any;
  const p = props as PageProps;

  return (
    <AppLayout>
      <Head title={p.article.title} />
      <PageHero
        badge={{ text: "Articles", icon: <Newspaper className="h-4 w-4" /> }}
        title={p.article.title}
        description={`${p.labels[p.article.status] ?? p.article.status} • ${p.article.rubrik ?? "—"}`}
        gradient={{ from: "#203b8a", via: "#2a4db3", to: "#3560dc", direction: "to right", overlayOpacity: 0.66 }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {p.article.excerpt && (
          <p className="mb-4 text-gray-700">{p.article.excerpt}</p>
        )}
        <div className="prose max-w-none">
          {p.article.content ? p.article.content : <p className="text-gray-500">Tidak ada konten.</p>}
        </div>

        <div className="mt-8">
          <Link
            href={articles.index.url()}
            className="rounded border border-gray-200 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
