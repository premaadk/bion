// resources/js/pages/articles/edit.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageHero from '@/components/page-hero';
import {
  ShieldCheck,
  FileText,
  Highlighter,
  Eraser,
  Eye,
  Image as ImageIcon,
  Tag as TagIcon,
  MessageSquareText,
  Save,
  Send,
} from 'lucide-react';

type ReviewItem = {
  id: number;
  action: string;
  note?: string | null;
  actor?: string | null;
  created_at?: string | null;
};

type ArticlePayload = {
  id: number;
  title: string;
  status: string;
  rubrik_id?: number | null;
  rubrik?: string | null;
  author?: string | null;
  excerpt?: string | null;
  content: string; // Quill HTML
  published_at?: string | null;
  is_anonymous: boolean;
  meta?: {
    cover_url?: string | null;
    cover_path?: string | null;
    keywords?: string[];
  } | null;
  reviews?: ReviewItem[];
};

type EditPageProps = {
  article: ArticlePayload;
  labels: Record<string, string>;
  reviews?: ReviewItem[];
  rubriks?: { id: number; name: string }[];
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

export default function EditArticlePage({
  article,
  labels,
  reviews: reviewsProp,
  rubriks = [],
}: EditPageProps) {
  // ============ Form (local) ============
  const [title, setTitle] = useState(article.title ?? '');
  const [slug, setSlug] = useState(slugify(article.title ?? ''));
  const [rubrikId, setRubrikId] = useState<number | ''>(article.rubrik_id ?? '');
  const [excerpt, setExcerpt] = useState(article.excerpt ?? '');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(!!article.is_anonymous);
  const [keywords, setKeywords] = useState<string[]>([...(article.meta?.keywords ?? [])]);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState<string>(''); // catatan saat kirim revisi

  // Busy/lock state: saat proses kirim revisi semua tombol dinonaktifkan
  const [isBusy, setIsBusy] = useState(false);
  const [finalized, setFinalized] = useState(false); // sudah kirim revisi

  // ============ Quill ============
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [highlightCount, setHighlightCount] = useState(0);

  const status = article.status;

  // ============ Cover resolver ============
  const coverCandidates = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = (article.meta?.cover_url ?? '').trim();
    const path = (article.meta?.cover_path ?? '').trim();
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
  useEffect(() => setCoverIdx(0), [coverCandidates.join('|')]);
  const coverSrc = coverCandidates[coverIdx];

  // ============ Reviews ============
  const reviews: ReviewItem[] = useMemo(() => {
    const asArr = (v: any) => (Array.isArray(v) ? v : []);
    const norm = (list: ReviewItem[]) =>
      list.map((r) => ({
        ...r,
        actor:
          typeof (r as any).actor === 'string'
            ? (r as any).actor
            : (r as any).actor?.name || (r as any).user?.name || null,
      }));
    return [...norm(asArr(reviewsProp)), ...norm(asArr(article.reviews))].sort((a, b) => {
      const ta = a.created_at ? +new Date(a.created_at) : 0;
      const tb = b.created_at ? +new Date(b.created_at) : 0;
      return tb - ta;
    });
  }, [reviewsProp, article.reviews]);

  const lastRevisionNote = useMemo(
    () => reviews.find((r) => r.action === 'request_revision' && (r.note ?? '').trim() !== ''),
    [reviews]
  );

  // ============ Quill Init ============
  useEffect(() => {
    const init = () => {
      if (!editorRef.current || quillRef.current) return;

      quillRef.current = new window.Quill(editorRef.current, {
        theme: 'snow',
        readOnly: false,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'blockquote', 'code-block'],
            ['clean'],
          ],
          clipboard: true,
        },
      });

      quillRef.current.clipboard.dangerouslyPasteHTML(article.content || '');

      quillRef.current.on('text-change', () => {
        const html = quillRef.current.root.innerHTML;
        setExcerpt((prev) => (prev ? prev : computeExcerptFromHTML(html)));
        recountHighlights();
      });

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
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(css);

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
    if (!root) return setHighlightCount(0);
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

  // highlight tools
  const applyHighlight = () => {
    if (isBusy || finalized) return;
    const range = quillRef.current?.getSelection(true);
    if (!range || range.length === 0) return;
    withTempEnable(() => {
      quillRef.current.format('background', '#fff59d');
    });
  };
  const removeHighlight = () => {
    if (isBusy || finalized) return;
    const range = quillRef.current?.getSelection(true);
    if (!range || range.length === 0) return;
    withTempEnable(() => {
      quillRef.current.format('background', false);
    });
  };
  const clearAllHighlights = () => {
    if (isBusy || finalized) return;
    if (!quillRef.current) return;
    withTempEnable(() => {
      const len = quillRef.current.getLength();
      quillRef.current.formatText(0, len, 'background', false);
    });
  };

  // ============ Helpers ============
  const label = (k: string) => labels[k] ?? k;

  const onAddTag = (t: string) => {
    const v = t.trim();
    if (!v) return;
    if (!keywords.includes(v)) setKeywords([...keywords, v]);
  };

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      onAddTag(tagInput);
      setTagInput('');
    }
  };

  // cover upload via fetch JSON
  const onPickCover: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (isBusy || finalized) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('cover', file);
    const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

    const res = await fetch(`/articles/${article.id}/cover`, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': token || '' },
      body: fd,
    });

    if (res.ok) {
      await res.json();
      router.reload({ only: ['article'] });
    }
  };

  // ============ Actions ============
  const saveDraft = () => {
    if (isBusy || finalized) return;
    setIsBusy(true);
    const html = quillRef.current?.root?.innerHTML || article.content || '';
    router.put(
      `/articles/${article.id}`,
      {
        title,
        slug,
        rubrik_id: rubrikId || null,
        excerpt: excerpt || null,
        content: html,
        is_anonymous: isAnonymous ? 1 : 0,
        meta: { keywords },
      },
      {
        preserveScroll: true,
        onFinish: () => setIsBusy(false),
      }
    );
  };

  const sendRevised = () => {
    if (isBusy || finalized) return;
    setIsBusy(true);
    const html = quillRef.current?.root?.innerHTML || article.content || '';
    // 1) Simpan konten terbaru
    router.put(
      `/articles/${article.id}`,
      {
        title,
        slug,
        rubrik_id: rubrikId || null,
        excerpt: excerpt || null,
        content: html,
        is_anonymous: isAnonymous ? 1 : 0,
        meta: { keywords },
      },
      {
        preserveScroll: true,
        // 2) Setelah tersimpan, set status "revised"
        onSuccess: () => {
          router.post(
            `/articles/${article.id}/revised`,
            { note },
            {
              preserveScroll: true,
              onSuccess: () => {
                // Kunci semua tombol dan alihkan ke index
                setFinalized(true);
                setIsBusy(true);
                router.visit('/articles', { replace: true });
              },
              onError: () => setIsBusy(false),
            }
          );
        },
        onError: () => setIsBusy(false),
      }
    );
  };

  const allDisabled = isBusy || finalized;

  // ============ Render ============
  return (
    <AppLayout>
      <PageHero
        badge={{ text: 'Ubah Artikel', icon: <ShieldCheck className="h-4 w-4" /> }}
        title={title}
        description={`Status: ${label(status)}`}
        gradient={{ from: '#203b8a', via: '#2a4db3', to: '#3560dc', direction: 'to right', overlayOpacity: 0.66 }}
        media={{ imageUrl: '/images/hero/abstract-wave.jpg', objectPosition: 'center', dimOpacity: 0.2 }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-7 space-y-6">
            {/* Judul / Slug / Rubrik / Penulis anon */}
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">ID: #{article.id}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul</label>
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                  disabled={allDisabled}
                  className="w-full border rounded-md p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Judul artikel..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                  <input value={slug} readOnly disabled className="w-full border rounded-md p-2.5 bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rubrik</label>
                  <select
                    value={rubrikId}
                    onChange={(e) => setRubrikId(e.target.value ? Number(e.target.value) : '')}
                    disabled={allDisabled}
                    className="w-full border rounded-md p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">— Pilih Rubrik —</option>
                    {rubriks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Penulis</label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    disabled={allDisabled}
                  />
                  <span>Anonim</span>
                </label>
              </div>
            </div>

            {/* COVER + TAGS */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Cover */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-800 text-sm">Gambar Sampul</span>
                </div>
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt="Cover"
                    className="rounded-md max-h-80 w-full object-contain border border-gray-200"
                    onError={() => setCoverIdx((i) => (i + 1 < coverCandidates.length ? i + 1 : i))}
                  />
                ) : (
                  <div className="border border-dashed rounded-md p-8 text-center text-sm text-gray-500">
                    Belum ada cover.
                  </div>
                )}
                <div className="mt-3">
                  <label
                    className={`inline-flex items-center px-3 py-2 border rounded-md cursor-pointer ${
                      allDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={onPickCover} disabled={allDisabled} />
                    Ganti Cover
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-800 text-sm">Tags</span>
                </div>
                <div className="mb-2">
                  {keywords.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2"
                    >
                      {t}
                      <button
                        type="button"
                        className="ml-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        disabled={allDisabled}
                        onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKey}
                  disabled={allDisabled}
                  placeholder="Ketik tag lalu Enter"
                  className="w-full border rounded-md p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Ringkasan catatan revisi */}
            {lastRevisionNote?.note && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="font-semibold text-yellow-900">Catatan Revisi dari Editor</div>
                <div className="mt-1 text-yellow-900 whitespace-pre-wrap">{lastRevisionNote.note}</div>
                <div className="mt-1 text-[11px] text-yellow-800/80">
                  {lastRevisionNote.actor ? `Oleh ${lastRevisionNote.actor}` : 'Editor'}
                  {lastRevisionNote.created_at ? ` • ${new Date(lastRevisionNote.created_at).toLocaleString()}` : ''}
                </div>
              </div>
            )}

            {/* Editor Konten */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Highlighter className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-800">Isi Artikel</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Stabilo: </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                    {highlightCount}
                  </span>
                </div>
              </div>

              {/* tombol stabilo */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={applyHighlight}
                  disabled={!hasSelection || allDisabled}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                             bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Highlighter className="h-4 w-4" />
                  Stabilo
                </button>
                <button
                  type="button"
                  onClick={removeHighlight}
                  disabled={!hasSelection || allDisabled}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                             bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eraser className="h-4 w-4" />
                  Hapus Stabilo Terpilih
                </button>
                <button
                  type="button"
                  onClick={clearAllHighlights}
                  disabled={allDisabled}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium
                             bg-white border-gray-200 text-gray-700 hover:bg-gray-50
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eraser className="h-4 w-4" />
                  Bersihkan Semua
                </button>
              </div>

              {/* Quill node */}
              <style>{`
                .ql-toolbar.ql-snow { border-top-left-radius: .5rem; border-top-right-radius: .5rem; border-color: #d1d5db; }
                .ql-container.ql-snow { border-bottom-left-radius: .5rem; border-bottom-right-radius: .5rem; border-color: #d1d5db; }
                .ql-editor { min-height: 360px; }
              `}</style>
              <div ref={editorRef} className="min-h-[360px]" />
              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Stabilo kuning dari editor tetap dipertahankan; Anda boleh mengubah teks langsung di sini.
              </p>
            </div>

            {/* Riwayat */}
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
                        {r.created_at ? new Date(r.created_at).toLocaleString() : ''} • {r.actor || 'System'} • {r.action}
                      </div>
                      {r.note && <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{r.note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Catatan & Aksi */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block font-semibold text-gray-700 mb-2">Catatan / Komentar</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                disabled={allDisabled}
                placeholder="Tuliskan penjelasan revisi untuk editor..."
                className="w-full border rounded-md p-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={allDisabled}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={sendRevised}
                  disabled={allDisabled}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  Kirim Revisi
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <Link href="/articles" className="hover:underline">
                &larr; Kembali ke daftar artikel
              </Link>
            </div>
          </div>

          {/* RIGHT: Timeline sederhana */}
          <div className="lg:col-span-3 space-y-6 lg:sticky top-20 self-start">
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
                  const active =
                    k === status ||
                    (orderIndex(k) <= orderIndex(status) && k !== ST.REJECTED && status !== ST.REJECTED);
                  const color =
                    k === status
                      ? k === ST.REVISION
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : active
                      ? 'bg-green-500'
                      : 'bg-gray-300';
                  const text =
                    k === status
                      ? k === ST.REVISION
                        ? 'text-yellow-700'
                        : 'text-gray-700'
                      : active
                      ? 'text-gray-700'
                      : 'text-gray-400';
                  return (
                    <li key={k} className="flex items-center mb-4 relative z-10">
                      <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center`} />
                      <p className={`ml-4 font-semibold text-sm ${text}`}>{label(k)}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ---------- small helpers ---------- */
function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
function htmlToPlain(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.replace(/\s+/g, ' ').trim();
}
function computeExcerptFromHTML(html: string): string {
  const plain = htmlToPlain(html);
  return plain.length > 280 ? plain.slice(0, 277) + '...' : plain;
}
function orderIndex(k: string) {
  return [
    ST.DRAFT,
    ST.SUBMITTED,
    ST.REVIEW_EDITOR,
    ST.REVISION,
    ST.REVISED,
    ST.APPROVED,
    ST.REVIEW_ADMIN,
    ST.PUBLISHED,
    ST.REJECTED,
  ].indexOf(k as any);
}