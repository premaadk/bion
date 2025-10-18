// resources/js/pages/articles/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

type ArticleRow = {
  id: number;
  title: string;
  slug?: string | null;
  status: string;                 // draft/submitted/review_editor/revision/revised/approved/review_admin/rejected/published
  rubrik?: string | null;         // nama rubrik (bisa di-slugify)
  excerpt?: string | null;
  cover_url?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  reason?: string | null;         // optional: alasan reject terakhir
};

type PageProps = {
  articles: ArticleRow[];
  labels: Record<string, string>;
  rubriks?: { id: number; name: string }[];
};

type UiArticle = {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  status: 'publish' | 'draft' | 'review' | 'rejected'; // untuk filter/label
  rawStatus: string;           // status backend asli → untuk rules tombol Edit
  slug?: string;
  rubrikName?: string | null;
  createdDate: string;
  reason?: string;
};

const mapToUiStatus = (s: string): UiArticle['status'] => {
  if (s === 'published') return 'publish';
  if (s === 'draft') return 'draft';
  if (s === 'rejected') return 'rejected';
  return 'review'; // submitted/review_editor/revision/revised/approved/review_admin → review
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const slugify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

export default function MyArticlesIndex({ articles }: PageProps) {
  const [activeFilter, setActiveFilter] = useState<'semua'|'publish'|'draft'|'review'|'rejected'>('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // transform data dari backend → struktur UI
  const articlesData = useMemo<UiArticle[]>(
    () =>
      (articles || []).map(a => ({
        id: a.id,
        title: a.title,
        description: a.excerpt || '',
        thumbnail: a.cover_url || undefined,
        status: mapToUiStatus(a.status),
        rawStatus: a.status,
        slug: a.slug ?? undefined,
        rubrikName: a.rubrik ?? null,
        createdDate: formatDate(a.updated_at || a.created_at),
        reason: a.reason || undefined,
      })),
    [articles]
  );

  // counter per filter
  const filterCounts = useMemo(
    () => ({
      semua: articlesData.length,
      publish: articlesData.filter(x => x.status === 'publish').length,
      draft: articlesData.filter(x => x.status === 'draft').length,
      review: articlesData.filter(x => x.status === 'review').length,
      rejected: articlesData.filter(x => x.status === 'rejected').length,
    }),
    [articlesData]
  );

  // apply filter + search
  const filteredArticles = useMemo(() => {
    let list = articlesData;
    if (activeFilter !== 'semua') list = list.filter(a => a.status === activeFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q));
    }
    return list;
  }, [articlesData, activeFilter, searchTerm]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const loadMore = () => setVisibleCount(v => v + 5);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const getFilterLabel = (f: string) =>
    ({ semua: 'Semua', publish: 'Publish', draft: 'Draft', review: 'Menunggu Review', rejected: 'Ditolak' }[f] || 'Semua');

  const getStatusBadge = (status: UiArticle['status']) => {
    const cfg = {
      publish: { icon: 'fas fa-check-circle', klass: 'bg-green-100 text-green-800', label: 'Publish' },
      draft:   { icon: 'fas fa-pencil-alt',   klass: 'bg-gray-100 text-gray-800',  label: 'Draft' },
      review:  { icon: 'fas fa-hourglass-half', klass: 'bg-yellow-100 text-yellow-800', label: 'Menunggu Review' },
      rejected:{ icon: 'fas fa-times-circle', klass: 'bg-red-100 text-red-800', label: 'Ditolak' },
    } as const;
    const c = cfg[status];
    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${c.klass}`}>
        <i className={`${c.icon} mr-1.5`} /> {c.label}
      </span>
    );
  };

  // URL helper:
  // - published → /articles/{slug-rubrik}/{slug-article}
  //   (fallback aman jika slug tidak tersedia → /articles/{id})
  // - selain published → /articles/{id} (read-only progress)
  const viewUrlOf = (a: UiArticle) => {
    if (a.status === 'publish') {
      const rubrikSlug = a.rubrikName ? slugify(a.rubrikName) : null;
      const articleSlug = a.slug ? a.slug : null;
      if (rubrikSlug && articleSlug) {
        return `/articles/${rubrikSlug}/${articleSlug}`;
      }
      // fallback jika backend belum kirim slug lengkap
      return `/articles/${a.id}`;
    }
    return `/articles/${a.id}`;
  };

  // Tombol aksi:
  // - Selalu tampilkan 2 tombol: Lihat & Edit
  // - Edit hanya aktif untuk rawStatus = draft atau revision
  const actionsFor = (a: UiArticle) => {
    const canEdit = a.rawStatus === 'draft' || a.rawStatus === 'revision';
    return (
      <div className="flex flex-wrap gap-3 items-center">
        <Link
          href={viewUrlOf(a)}
          className="text-sm font-semibold text-[#203b8a] hover:underline"
        >
          Lihat &rarr;
        </Link>
        {canEdit ? (
          <Link
            href={`/articles/${a.id}/edit`}
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            Edit &rarr;
          </Link>
        ) : (
          <span
            aria-disabled
            className="text-sm font-semibold text-gray-400 cursor-not-allowed"
            title="Hanya bisa diedit saat status Draft atau Revision"
          >
            Edit &rarr;
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="w-full">
      {/* HERO */}
      <div className="w-full pt-6 sm:pt-8 lg:pt-12">
        <div className="relative mx-4 sm:mx-6 lg:mx-8 mb-8 sm:mb-10 lg:mb-14 rounded-2xl bg-gradient-to-r from-[#203b8a] via-[#2a4db3] to-[#3560dc] min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] overflow-visible">
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1080&q=80"
              alt=""
              className="w-full h-full object-cover opacity-20"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/1080x400/203b8a/ffffff?text=Artikelku+Hero'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#203b8a]/85 to-[#3560dc]/70" />
          </div>

          <div className="relative z-10 h-full flex items-center justify-center text-white text-center py-8 sm:py-10 lg:py-12 px-3 sm:px-4 lg:px-6">
            <div className="max-w-4xl w-full space-y-6">
              <div className="hidden sm:flex justify-center">
                <div className="inline-flex items-center bg-white/25 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20">
                  <i className="fas fa-newspaper text-yellow-300 mr-2 text-base" />
                  <span className="text-base font-medium">Kelola Artikel</span>
                </div>
              </div>
              <div className="block sm:hidden absolute top-4 right-4">
                <div className="inline-flex items-center bg-white/25 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                  <i className="fas fa-newspaper text-yellow-300 mr-1.5 text-xs" />
                  <span className="text-xs font-medium">Kelola Artikel</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-4 mt-12 sm:mt-0">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Artikel Saya</h1>
                <p className="text-base sm:text-lg lg:text-xl opacity-95 leading-relaxed">Lihat, kelola, dan buat artikel baru Anda di sini.</p>
              </div>

              {/* FILTER BAR */}
              <div className="pt-4 sm:pt-6 relative z-40">
                <div className="max-w-6xl mx-auto px-2 sm:px-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                    <div className="flex flex-col items-center gap-4">
                      {/* desktop group */}
                      <div className="hidden sm:flex flex-wrap items-center justify-center gap-2">
                        {(['semua','publish','draft','review','rejected'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`font-semibold py-2 px-4 rounded-full text-sm transition-all ${
                              activeFilter === f ? 'bg-white text-[#203b8a] shadow-md' : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
                            }`}
                          >
                            {getFilterLabel(f)} ({filterCounts[f]})
                          </button>
                        ))}
                      </div>

                      {/* mobile dropdown */}
                      <div className="block sm:hidden w-full max-w-xs" ref={dropdownRef}>
                        <div className="relative">
                          <button
                            onClick={() => setIsDropdownOpen(p => !p)}
                            className="w-full bg-white/20 border border-white/20 text-white rounded-full py-2.5 px-4 flex items-center justify-between text-sm font-semibold hover:bg-white/30"
                          >
                            <span>{getFilterLabel(activeFilter)} ({filterCounts[activeFilter]})</span>
                            <i className={`fas fa-chevron-down transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                              {(['semua','publish','draft','review','rejected'] as const).map(f => (
                                <button
                                  key={f}
                                  onClick={() => { setActiveFilter(f); setIsDropdownOpen(false); }}
                                  className={`w-full text-left px-4 py-3 text-sm ${activeFilter === f ? 'bg-[#203b8a] text-white font-semibold' : 'text-gray-800 hover:bg-gray-50'}`}
                                >
                                  <span className="flex items-center justify-between">
                                    <span>{getFilterLabel(f)}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${activeFilter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                      {filterCounts[f]}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* search + create */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl">
                        <div className="relative flex-1 w-full">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <i className="fas fa-search text-white/60" />
                          </span>
                          <input
                            type="text"
                            placeholder="Cari judul artikel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/20 border border-white/20 text-white placeholder-white/60 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                          />
                        </div>
                        <Link
                          href="/articles/create"
                          className="w-full sm:w-auto bg-white hover:bg-white/90 text-[#203b8a] font-bold py-2.5 px-6 rounded-full flex items-center justify-center shadow-md text-sm"
                        >
                          <i className="fas fa-plus mr-2" /> Tulis Artikel Baru
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="space-y-4">
          {visibleArticles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <i className="fas fa-newspaper text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada artikel ditemukan</h3>
              <p className="text-gray-600">
                {searchTerm ? `Tidak ada artikel yang sesuai dengan pencarian "${searchTerm}"` : 'Belum ada artikel dalam kategori ini'}
              </p>
            </div>
          ) : (
            visibleArticles.map(a => (
              <div key={a.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-5 flex flex-col md:flex-row gap-5">
                  {/* Thumb */}
                  {a.thumbnail ? (
                    <img className="h-40 w-full md:w-56 object-cover rounded-md" src={a.thumbnail} alt="" />
                  ) : (
                    <div className="h-40 w-full md:w-56 bg-gray-200 rounded-md flex items-center justify-center">
                      <i className="fas fa-image text-gray-400 text-4xl" />
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-grow flex flex-col">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        {getStatusBadge(a.status)}
                        <div className="relative">
                          <button className="text-gray-500 hover:bg-gray-200 w-8 h-8 rounded-full opacity-0 md:opacity-100 transition-opacity">
                            <i className="fas fa-ellipsis-h" />
                          </button>
                        </div>
                      </div>

                      <h2 className={`text-xl font-bold mb-2 ${a.status === 'review' || a.status === 'rejected' ? 'text-gray-600' : 'text-gray-900'} hover:text-[#203b8a]`}>
                        {a.title}
                      </h2>

                      {!!a.description && (
                        <p className={`text-sm leading-relaxed hidden sm:block ${a.status === 'review' || a.status === 'rejected' ? 'text-gray-500' : 'text-gray-600'}`}>
                          {a.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 gap-3">
                      <div className="flex items-center space-x-4">
                        {a.status === 'rejected' && a.reason ? (
                          <span className="font-semibold text-red-600">Alasan: {a.reason}</span>
                        ) : (
                          <span className="font-medium">Diperbarui: {a.createdDate}</span>
                        )}
                      </div>
                      <p className="font-medium">
                        {a.status === 'draft'
                          ? 'Terakhir disimpan'
                          : a.status === 'review'
                          ? 'Diajukan'
                          : a.status === 'rejected'
                          ? 'Ditinjau'
                          : 'Diterbitkan'}: {a.createdDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer actions → 2 tombol: Lihat & Edit */}
                <div className="bg-gray-50 px-5 py-3 flex flex-wrap gap-3 justify-end items-center">
                  {actionsFor(a)}
                </div>
              </div>
            ))
          )}

          {visibleCount < filteredArticles.length && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-6 border border-gray-300 rounded-lg shadow-sm"
              >
                Muat Lebih Banyak
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}