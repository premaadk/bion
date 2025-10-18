// resources/js/pages/admin/articles/show.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageHero from '@/components/page-hero';
import {
  FileText,
  ShieldCheck,
  Highlighter,
  Eraser,
  BadgeCheck,
  Stamp,
  CheckCircle2,
  XCircle,
  Eye,
  Image as ImageIcon,
  Tag as TagIcon,
  MessageSquareText,
} from 'lucide-react';

type ReviewItem = {
  id: number;
  action: string;            // e.g. "request_revision", "approve", "review_editor", ...
  note?: string | null;
  actor?: string | null;     // nama pelaku bila dikirim
  created_at?: string | null;
};

type ArticlePayload = {
  id: number;
  title: string;
  status: string;
  rubrik?: string | null;
  author?: string | null;
  excerpt?: string | null;
  content: string; // Quill HTML (inner of .ql-editor)
  published_at?: string | null;
  is_anonymous: boolean;
  meta?: {
    cover_url?: string | null;
    cover_path?: string | null;
    keywords?: string[];
  } | null;
  // beberapa backend mungkin mengirimkan langsung di dalam article
  reviews?: ReviewItem[];
  review_history?: ReviewItem[];
};

type ShowPageProps = {
  article: ArticlePayload;
  labels: Record<string, string>;
  // beberapa backend menaruh di root props
  reviews?: ReviewItem[];
};

declare global {
  interface Window {
    Quill: any;
  }
}

const ST = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEW_EDITOR: 'review_editor',
  REVISION: 'revision',
  REVISED: 'revised',
  APPROVED: 'approved',
  REVIEW_ADMIN: 'review_admin',
  REJECTED: 'rejected',
  PUBLISHED: 'published',
} as const;

export default function AdminArticleShow({ article, labels, reviews: reviewsProp }: ShowPageProps) {
  // ================== State ==================
  const [note, setNote] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);

  // Quill (read-only viewer, highlight-only via our buttons)
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [highlightCount, setHighlightCount] = useState<number>(0);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // ================== Status helpers ==================
  const status = article.status;
  const isSubmitted = status === ST.SUBMITTED;
  const isReviewEditor = status === ST.REVIEW_EDITOR;
  const isRevision = status === ST.REVISION;
  const isRevised = status === ST.REVISED;
  const isApproved = status === ST.APPROVED;
  const isReviewAdmin = status === ST.REVIEW_ADMIN;
  const isRejected = status === ST.REJECTED;
  const isPublished = status === ST.PUBLISHED;

  const canRequestRevision =
    isReviewEditor && note.trim().length > 0 && highlightCount > 0 && !busy;
  const canApprove = isReviewEditor && !busy;
  const canReject = isReviewAdmin && !busy;
  const canPublish = isReviewAdmin && !busy;
  const canStartEditorReview = (isSubmitted || isRevised) && !busy;
  const canStartAdminReview = isApproved && !busy;

  // ================== Quill Init (viewer) ==================
  useEffect(() => {
    const init = () => {
      if (!editorRef.current || quillRef.current) return;

      quillRef.current = new window.Quill(editorRef.current, {
        theme: 'snow',
        readOnly: true,
        modules: { toolbar: false, clipboard: true },
      });

      // paste initial content
      quillRef.current.clipboard.dangerouslyPasteHTML(article.content || '');

      // track selection
      quillRef.current.on('selection-change', (range: any) => {
        setHasSelection(!!range && range.length > 0);
      });

      recountHighlights();
    };

    const ensureQuill = async () => {
      if (window.Quill) {
        init();
        return;
      }
      // load CSS
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(css);
      // load JS
      const s = document.createElement('script');
      s.src = 'https://cdn.quilljs.com/1.3.6/quill.min.js';
      s.onload = () => init();
      document.head.appendChild(s);
    };
    ensureQuill();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article.id]);

  const recountHighlights = () => {
    const root = editorRef.current?.querySelector('.ql-editor') as HTMLElement | null;
    if (!root) {
      setHighlightCount(0);
      return;
    }
    const spans = root.querySelectorAll<HTMLElement>('[style*="background"]');
    setHighlightCount(spans.length);
  };

  const withTempEnable = (fn: () => void) => {
    if (!quillRef.current) return;
    const wasEnabled = quillRef.current.isEnabled();
    quillRef.current.enable(true);
    try {
      fn();
    } finally {
      quillRef.current.enable(wasEnabled);
      recountHighlights();
    }
  };

  // ===== Persist HTML (agar stabilo tidak hilang setelah refresh)
  const saveContentNow = () => {
    if (!quillRef.current) return;
    const html = quillRef.current.root.innerHTML;
    router.put(`/admin/articles/${article.id}/content`, { content: html }, { preserveScroll: true });
  };

  const applyHighlight = () => {
    if (!quillRef.current) return;
    const range = quillRef.current.getSelection(true);
    if (!range || range.length === 0) return;
    withTempEnable(() => {
      quillRef.current.format('background', '#fff59d'); // soft yellow
    });
    saveContentNow();
  };

  const removeHighlight = () => {
    if (!quillRef.current) return;
    const range = quillRef.current.getSelection(true);
    if (!range || range.length === 0) return;
    withTempEnable(() => {
      quillRef.current.format('background', false);
    });
    saveContentNow();
  };

  const clearAllHighlights = () => {
    if (!quillRef.current) return;
    withTempEnable(() => {
      const len = quillRef.current.getLength();
      quillRef.current.formatText(0, len, 'background', false);
    });
    saveContentNow();
  };

  // ================== Cover URL resolver (robust) ==================
  const coverCandidates = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const m = article.meta ?? {};
    const url = (m.cover_url ?? '').trim();
    const path = (m.cover_path ?? '').trim();

    const list: string[] = [];
    if (url) list.push(url);
    if (url && url.startsWith('/')) list.push(origin + url);
    if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      list.push(origin + '/storage/' + url.replace(/^\/+/, ''));
    }
    if (path) {
      if (/^https?:\/\//i.test(path)) list.push(path);
      else list.push(origin + '/storage/' + path.replace(/^\/+/, ''));
    }
    return Array.from(new Set(list.filter(Boolean)));
  }, [article.meta?.cover_url, article.meta?.cover_path]);

  const [coverIdx, setCoverIdx] = useState(0);
  useEffect(() => setCoverIdx(0), [coverCandidates.join('|')]); // reset index bila kandidat berubah
  const coverSrc = coverCandidates[coverIdx];

  // ================== Reviews (Catatan Editor) ==================
  const reviews: ReviewItem[] = useMemo(() => {
    const asArray = (v: any): ReviewItem[] => (Array.isArray(v) ? v : []);
    const flat: ReviewItem[] = [
      ...asArray(reviewsProp),
      ...asArray(article.reviews),
      ...asArray(article.review_history),
    ].map((r) => {
      // normalisasi property actor (kadang berupa object)
      const actor =
        typeof (r as any).actor === 'string'
          ? (r as any).actor
          : (r as any).actor?.name || (r as any).user?.name || null;
      return { ...r, actor };
    });

    // sort terbaru di atas
    return flat.sort((a, b) => {
      const ta = a.created_at ? +new Date(a.created_at) : 0;
      const tb = b.created_at ? +new Date(b.created_at) : 0;
      return tb - ta;
    });
  }, [reviewsProp, article.reviews, article.review_history]);

  const lastRevisionNote = useMemo(() => {
    return reviews.find((r) => r.action === 'request_revision' && (r.note ?? '').trim() !== '');
  }, [reviews]);

  // ================== Actions ==================
  const postAction = (url: string, payload?: Record<string, any>) =>
    new Promise<void>((resolve) => {
      router.post(url, payload ?? {}, { preserveScroll: true, onFinish: () => resolve() });
    });

  const onStartEditorReview = async () => {
    setBusy('review-editor');
    await postAction(`/admin/articles/${article.id}/review-editor`, { note: note || null });
    setBusy(null);
  };

  const onRequestRevision = async () => {
    if (!canRequestRevision) return;
    setBusy('request-revision');
    await postAction(`/admin/articles/${article.id}/request-revision`, { note });
    setBusy(null);
  };

  const onApprove = async () => {
    if (!canApprove) return;
    setBusy('approve');
    await postAction(`/admin/articles/${article.id}/approve`, { note: note || null });
    setBusy(null);
  };

  const onStartAdminReview = async () => {
    if (!canStartAdminReview) return;
    setBusy('review-admin');
    await postAction(`/admin/articles/${article.id}/review-admin`, { note: note || null });
    setBusy(null);
  };

  const onReject = async () => {
    if (!canReject) return;
    setBusy('reject');
    await postAction(`/admin/articles/${article.id}/reject`, { note: note || null });
    setBusy(null);
  };

  const onPublish = async () => {
    if (!canPublish) return;
    setBusy('publish');
    await postAction(`/admin/articles/${article.id}/publish`, { note: note || null });
    setBusy(null);
  };

  // ================== UI helpers ==================
  const StatusPill: React.FC<{ label: string; variant: 'success' | 'warning' | 'muted' | 'danger' | 'info' }> = ({
    label,
    variant,
  }) => {
    const styles: Record<string, string> = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      danger: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      muted: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${styles[variant]}`}>
        {label}
      </span>
    );
  };

  const stepStyle = (key: string): { dot: string; text: string; pulse?: boolean } => {
    const base = { dot: 'bg-gray-300', text: 'text-gray-400' };
    if (status === ST.DRAFT) {
      if (key === ST.DRAFT) return { dot: 'bg-green-500 text-white', text: 'text-gray-700' };
      return base;
    }
    const reached = (k: string) => {
      const order = [
        ST.DRAFT,
        ST.SUBMITTED,
        ST.REVIEW_EDITOR,
        ST.REVISION,
        ST.REVISED,
        ST.APPROVED,
        ST.REVIEW_ADMIN,
        ST.PUBLISHED,
      ];
      const iCurrent = order.indexOf(status as any);
      const iKey = order.indexOf(k as any);
      return iKey >= 0 && iKey <= iCurrent;
    };

    if (key === ST.REJECTED) {
      if (isRejected) return { dot: 'bg-red-500 text-white', text: 'text-red-700' };
      return base;
    }

    if (key === status) {
      if (key === ST.REVISION) return { dot: 'bg-yellow-500 text-white', text: 'text-yellow-700', pulse: true };
      if (key === ST.REVIEW_EDITOR || key === ST.REVIEW_ADMIN) return { dot: 'bg-blue-500 text-white', text: 'text-blue-700' };
      if (key === ST.PUBLISHED) return { dot: 'bg-green-600 text-white', text: 'text-green-700' };
      return { dot: 'bg-green-500 text-white', text: 'text-gray-700' };
    }

    if (reached(key)) return { dot: 'bg-green-500 text-white', text: 'text-gray-700' };
    return base;
  };

  const label = (k: string) => labels[k] ?? k;

  const authorText = (() => {
    const base = article.author ? article.author : '—';
    return article.is_anonymous ? `Anonim (${base})` : base;
  })();

  // ================== Render ==================
  return (
    <AppLayout>
      <PageHero
        badge={{ text: 'Manajemen Artikel', icon: <ShieldCheck className="h-4 w-4" /> }}
        title={article.title}
        description={
          article.rubrik
            ? `Rubrik: ${article.rubrik} · Penulis: ${authorText}`
            : `Penulis: ${authorText}`
        }
        gradient={{
          from: '#203b8a',
          via: '#2a4db3',
          to: '#3560dc',
          direction: 'to right',
          overlayOpacity: 0.66,
        }}
        media={{ imageUrl: '/images/hero/abstract-wave.jpg', objectPosition: 'center', dimOpacity: 0.2 }}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-7 space-y-6">
            {/* Meta Card */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">ID: #{article.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isRejected ? (
                    <StatusPill label={label(ST.REJECTED)} variant="danger" />
                  ) : isPublished ? (
                    <StatusPill label={label(ST.PUBLISHED)} variant="success" />
                  ) : isReviewAdmin ? (
                    <StatusPill label={label(ST.REVIEW_ADMIN)} variant="info" />
                  ) : isApproved ? (
                    <StatusPill label={label(ST.APPROVED)} variant="success" />
                  ) : isReviewEditor ? (
                    <StatusPill label={label(ST.REVIEW_EDITOR)} variant="info" />
                  ) : isRevision ? (
                    <StatusPill label={label(ST.REVISION)} variant="warning" />
                  ) : isRevised ? (
                    <StatusPill label={label(ST.REVISED)} variant="info" />
                  ) : isSubmitted ? (
                    <StatusPill label={label(ST.SUBMITTED)} variant="muted" />
                  ) : (
                    <StatusPill label={label(ST.DRAFT)} variant="muted" />
                  )}
                </div>
              </div>

              {article.excerpt && <p className="text-gray-600 text-sm">{article.excerpt}</p>}

              {/* Ringkasan catatan revisi bila ada */}
              {isRevision && lastRevisionNote?.note && (
                <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                  <div className="font-semibold mb-1">Catatan Revisi Terakhir</div>
                  <div className="whitespace-pre-wrap">{lastRevisionNote.note}</div>
                  <div className="mt-1 text-[11px] text-yellow-800/80">
                    {lastRevisionNote.actor ? `Oleh ${lastRevisionNote.actor}` : 'Editor'}{lastRevisionNote.created_at ? ` • ${new Date(lastRevisionNote.created_at).toLocaleString()}` : ''}
                  </div>
                </div>
              )}

              {/* COVER (robust dengan fallback) */}
              {coverSrc && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-800 text-sm">Gambar Sampul</span>
                  </div>
                  <img
                    src={coverSrc}
                    alt="Cover"
                    className="rounded-md max-h-96 w-full object-contain border border-gray-200"
                    onError={() => setCoverIdx((i) => (i + 1 < coverCandidates.length ? i + 1 : i))}
                  />
                  {coverCandidates.length > 1 && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      (Jika gambar gagal dimuat, mencoba sumber lain: {coverIdx + 1}/{coverCandidates.length})
                    </p>
                  )}
                </div>
              )}

              {/* TAGS (jika ada) */}
              {article.meta?.keywords && article.meta.keywords.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TagIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-800 text-sm">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {article.meta.keywords.map((t, i) => (
                      <span
                        key={`${t}-${i}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Review Editor (Highlight-only) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Highlighter className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-800">Konten Artikel (Stabilo Revisi)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Stabilo: </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                    {highlightCount}
                  </span>
                </div>
              </div>

              {/* Custom toolbar (only highlight buttons) */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={applyHighlight}
                  disabled={!hasSelection}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                             bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Tandai teks terpilih dengan stabilo"
                >
                  <Highlighter className="h-4 w-4" />
                  Stabilo
                </button>
                <button
                  type="button"
                  onClick={removeHighlight}
                  disabled={!hasSelection}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                             bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hapus stabilo pada teks terpilih"
                >
                  <Eraser className="h-4 w-4" />
                  Hapus Stabilo Terpilih
                </button>
                <button
                  type="button"
                  onClick={clearAllHighlights}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                             bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  title="Bersihkan semua stabilo"
                >
                  <Eraser className="h-4 w-4" />
                  Bersihkan Semua
                </button>
              </div>

              {/* Quill viewer node */}
              <style>{`
                .ql-toolbar.ql-snow {
                  border-top-left-radius: 0.5rem;
                  border-top-right-radius: 0.5rem;
                  border-color: #d1d5db;
                }
                .ql-container.ql-snow {
                  border-bottom-left-radius: 0.5rem;
                  border-bottom-right-radius: 0.5rem;
                  border-color: #d1d5db;
                }
                .ql-editor {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  min-height: 360px;
                }
              `}</style>
              <div ref={editorRef} className="min-h-[360px]" />
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Konten dikunci untuk mencegah perubahan. Anda hanya dapat menandai <em>stabilo</em> pada teks; setiap perubahan stabilo langsung disimpan.
              </p>
            </div>

            {/* Panel Riwayat Catatan/ Tindakan */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareText className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">Riwayat Catatan & Tindakan</h3>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada catatan.</p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-md border border-gray-200 p-3">
                      <div className="text-xs text-gray-500">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : ''} •{' '}
                        {r.actor || 'System'} • {r.action}
                      </div>
                      {r.note && <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{r.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Note input untuk tindakan berikutnya */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block font-semibold text-gray-700 mb-2">Catatan / Komentar</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Tuliskan alasan revisi / persetujuan / pertimbangan admin di sini..."
                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#203b8a]/30 focus:border-[#203b8a]"
              />
              <div className="mt-2 text-xs text-gray-500">
                Untuk mengaktifkan tombol <strong>Minta Revisi</strong>, berikan setidaknya 1 stabilo pada konten dan isi catatan.
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3 space-y-6 lg:sticky top-20 self-start">
            {/* Status Timeline */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-xl border-b pb-3 mb-4">Status Artikel</h3>
              <ul className="relative">
                <li className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
                {[
                  ST.DRAFT,
                  ST.SUBMITTED,
                  ST.REVIEW_EDITOR,
                  ST.REVISION,
                  ST.REVISED,
                  ST.APPROVED,
                  ST.REVIEW_ADMIN,
                  ST.PUBLISHED,
                  ST.REJECTED,
                ].map((k) => {
                  const s = stepStyle(k);
                  return (
                    <li key={k} className="flex items-center mb-4 relative z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${s.dot} ${
                          s.pulse ? 'animate-pulse' : ''
                        }`}
                      >
                        {s.dot.startsWith('bg-green') || s.dot.startsWith('bg-blue') || s.dot.startsWith('bg-yellow') ? (
                          <i className="fas fa-check text-xs text-white" />
                        ) : null}
                      </div>
                      <p className={`ml-4 font-semibold text-sm ${s.text}`}>{label(k)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Action Panel - Editor */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-xl border-b pb-3 mb-4 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-blue-600" />
                Aksi Editor
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onStartEditorReview}
                  disabled={!canStartEditorReview}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border
                             bg-blue-600 text-white hover:bg-blue-700 border-blue-700
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Stamp className="h-4 w-4" />
                  Review by Editor
                </button>

                <button
                  type="button"
                  onClick={onRequestRevision}
                  disabled={!canRequestRevision}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border
                             bg-yellow-50 text-yellow-900 border-yellow-300 hover:bg-yellow-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Highlighter className="h-4 w-4" />
                  Minta Revisi
                </button>

                <button
                  type="button"
                  onClick={onApprove}
                  disabled={!canApprove}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border
                             bg-green-600 text-white hover:bg-green-700 border-green-700
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve (Editor)
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Tombol <strong>Revisi</strong> & <strong>Approve</strong> aktif setelah artikel masuk tahap <em>Review by Editor</em>.
              </p>
            </div>

            {/* Action Panel - Admin */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-xl border-b pb-3 mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Aksi Admin
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onStartAdminReview}
                  disabled={!canStartAdminReview}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border
                             bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-700
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Stamp className="h-4 w-4" />
                  Review by Admin
                </button>

                <button
                  type="button"
                  onClick={onReject}
                  disabled={!canReject}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border
                             bg-red-50 text-red-900 border-red-300 hover:bg-red-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>

                <button
                  type="button"
                  onClick={onPublish}
                  disabled={!canPublish}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border
                             bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Publish
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Tombol <strong>Reject</strong> & <strong>Publish</strong> aktif setelah artikel masuk tahap <em>Review by Admin</em>.
              </p>
            </div>

            {/* Hints */}
            <div className="bg-white p-4 rounded-lg shadow text-xs text-gray-500">
              <p className="mb-1">• Stabilo tidak mengubah isi artikel. Gunakan untuk menandai bagian yang perlu revisi.</p>
              <p>• Perubahan stabilo disimpan otomatis (persist di server) tiap kali Anda menambah/menghapus stabilo.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}