// resources/js/pages/articles/published.tsx
import React, { useEffect, useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import {
  CalendarDays,
  Clock3,
  User,
  Tag as TagIcon,
  ArrowLeft,
  Share2,
} from 'lucide-react';

type ArticlePayload = {
  id: number;
  title: string;
  slug?: string | null;
  rubrik?: string | null;
  rubrik_slug?: string | null;
  author?: string | null;
  published_at?: string | null;
  content: string; // Quill HTML (inner of .ql-editor)
  meta?: {
    cover_url?: string | null;
    keywords?: string[];
  } | null;
};

type PageProps = {
  article: ArticlePayload;
};

export default function PublishedArticle({ article }: PageProps) {
  // --- ensure Quill CSS loaded so .ql-* classes render nicely
  useEffect(() => {
    const id = 'quill-snow-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(link);
    }
  }, []);

  // --- date & reading time
  const publishedDate = useMemo(() => {
    if (!article.published_at) return '';
    return new Date(article.published_at).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [article.published_at]);

  const readingMinutes = useMemo(() => {
    const plain = htmlToText(article.content || '');
    const words = plain.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)); // ±200 wpm
  }, [article.content]);

  const cover = article.meta?.cover_url || '';
  const keywords = article.meta?.keywords ?? [];

  const pageTitle = article.title;
  const pageDesc =
    htmlToText(article.content || '').slice(0, 160) ||
    `Artikel rubrik ${article.rubrik || ''}`;

  const shareUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `/articles/${article.rubrik_slug || ''}/${article.slug || article.id}`;

  return (
    <main className="w-full">
      <Head title={pageTitle}>
        {/* basic SEO/OG */}
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        {cover ? <meta property="og:image" content={cover} /> : null}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* HERO */}
      <div className="w-full pt-6 sm:pt-10 lg:pt-12">
        <div className="relative mx-4 sm:mx-6 lg:mx-8 mb-6 sm:mb-10 rounded-2xl overflow-hidden">
          <div className="absolute inset-0">
            {cover ? (
              <img
                src={cover}
                alt=""
                className="w-full h-full object-cover opacity-30"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#203b8a] via-[#2a4db3] to-[#3560dc]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
          </div>

          <div className="relative z-10 px-4 sm:px-8 lg:px-12 py-10">
            <div className="max-w-4xl">
              <Link
                href={`/rubrik/${article.rubrik_slug || ''}`}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white text-xs sm:text-sm font-semibold bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur"
              >
                <ArrowLeft className="h-4 w-4" />
                {article.rubrik || 'Rubrik'}
              </Link>

              <h1 className="mt-4 text-white text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {article.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-white/90 text-sm">
                {article.author && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {article.author}
                  </span>
                )}
                {publishedDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {publishedDate}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {readingMinutes} menit baca
                </span>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(shareUrl);
                    }
                    try {
                      if (window?.navigator?.share) {
                        window.navigator.share({ title: article.title, url: shareUrl });
                      }
                    } catch {}
                  }}
                  className="ml-auto inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full border border-white/20"
                >
                  <Share2 className="h-4 w-4" /> Bagikan
                </button>
              </div>

              {keywords.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {keywords.map((k, i) => (
                    <span
                      key={`${k}-${i}`}
                      className="inline-flex items-center gap-1.5 text-white/90 text-xs font-semibold px-3 py-1 rounded-full bg-white/15 border border-white/20"
                    >
                      <TagIcon className="h-3.5 w-3.5" />
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ARTICLE CARD */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="w-full rounded-xl shadow-md mb-6 object-cover max-h-[480px]"
          />
        ) : null}

        <article className="bg-white rounded-xl shadow-md p-5 sm:p-8">
          {/* Quill content */}
          <ArticleBody html={article.content || ''} />
        </article>

        {/* bottom tags (if any) */}
        {keywords.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {keywords.map((k, i) => (
              <Link
                key={`${k}-${i}`}
                href={`/tags/${encodeURIComponent(k)}`}
                className="inline-flex items-center gap-1.5 text-[#203b8a] text-xs font-semibold px-3 py-1 rounded-full bg-[#203b8a]/5 border border-[#203b8a]/20 hover:bg-[#203b8a]/10"
              >
                <TagIcon className="h-3.5 w-3.5" />
                {k}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- subcomponents & helpers ---------- */

function ArticleBody({ html }: { html: string }) {
  useEffect(() => {
    // ensure images inside content never overflow
    const imgs = document.querySelectorAll<HTMLImageElement>('.ql-editor img');
    imgs.forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '0.5rem';
    });
  }, [html]);

  return (
    <>
      <style>{`
        /* Make Quill content typographic & readable */
        .ql-editor {
          font-size: 1.05rem;
          line-height: 1.9;
          color: #111827;
          padding: 0 !important;
        }
        .ql-editor p { margin: 0 0 1em 0; }
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4 {
          margin: 1.4em 0 .6em; font-weight: 800; line-height: 1.25;
        }
        .ql-editor h1 { font-size: 2rem; }
        .ql-editor h2 { font-size: 1.5rem; }
        .ql-editor h3 { font-size: 1.25rem; }
        .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding: .75rem 1rem; background: #f9fafb; border-radius: .5rem; color: #374151;
          margin: 1rem 0;
        }
        .ql-editor pre.ql-syntax {
          background: #0b1220; color: #f8fafc; padding: 1rem; border-radius: .75rem; overflow:auto;
          font-size: .9rem;
        }
        .ql-editor a { color: #1d4ed8; text-decoration: underline; }
        .ql-editor ul, .ql-editor ol { padding-left: 1.25rem; margin: .75rem 0; }
        .ql-editor img { display: block; margin: 1rem auto; }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        table td, table th { border: 1px solid #e5e7eb; padding: .5rem .75rem; }
      `}</style>

      {/* We deliberately keep Quill *container* classes for proper styling */}
      <div className="ql-container ql-snow !border-0 !p-0">
        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </>
  );
}

function htmlToText(html: string) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}