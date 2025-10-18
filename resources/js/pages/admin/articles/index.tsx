// resources/js/pages/admin/articles/index.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';

type Row = {
  id: number;
  title: string;
  status: string;
  rubrik?: string | null;
  author?: string | null;
  updated_at?: string | null;
  cover_url?: string | null;
};

type Props = {
  articles: Row[];
  labels: Record<string, string>;
  rubriks: { id: number; name: string }[];
  filters?: { rubrik_id?: number | null };
};

type UiArticle = {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  status: 'publish' | 'draft' | 'review' | 'rejected';
  createdDate: string;
};

const mapS = (s: string): UiArticle['status'] => {
  if (s === 'published') return 'publish';
  if (s === 'draft') return 'draft';
  if (s === 'rejected') return 'rejected';
  return 'review';
};
const fdate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function AdminArticlesIndex({ articles, rubriks, filters }: Props) {
  const [activeFilter, setActiveFilter] = useState<'semua'|'publish'|'draft'|'review'|'rejected'>('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const [rubrikId, setRubrikId] = useState<string>(() => {
    const r = filters?.rubrik_id;
    return r ? String(r) : '';
  });

  // transform
  const data = useMemo<UiArticle[]>(() =>
    (articles || []).map(a => ({
      id: a.id,
      title: a.title,
      description: [a.rubrik, a.author].filter(Boolean).join(' • ') || '',
      thumbnail: a.cover_url || undefined,
      status: mapS(a.status),
      createdDate: fdate(a.updated_at),
    }))
  , [articles]);

  const counts = useMemo(() => ({
    semua: data.length,
    publish: data.filter(x => x.status === 'publish').length,
    draft: data.filter(x => x.status === 'draft').length,
    review: data.filter(x => x.status === 'review').length,
    rejected: data.filter(x => x.status === 'rejected').length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (activeFilter !== 'semua') list = list.filter(a => a.status === activeFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q));
    }
    return list;
  }, [data, activeFilter, searchTerm]);

  const visible = filtered.slice(0, visibleCount);

  const badge = (s: UiArticle['status']) => {
    const cfg = {
      publish: { icon: 'fas fa-check-circle', klass: 'bg-green-100 text-green-800', label: 'Publish' },
      draft:   { icon: 'fas fa-pencil-alt',   klass: 'bg-gray-100 text-gray-800',  label: 'Draft' },
      review:  { icon: 'fas fa-hourglass-half', klass: 'bg-yellow-100 text-yellow-800', label: 'Review' },
      rejected:{ icon: 'fas fa-times-circle', klass: 'bg-red-100 text-red-800', label: 'Ditolak' },
    } as const;
    const c = cfg[s];
    return <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${c.klass}`}>
      <i className={`${c.icon} mr-1.5`} /> {c.label}
    </span>;
  };

  const onRubrikChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const val = e.target.value;
    setRubrikId(val);
    router.get('/admin/articles', val ? { rubrik_id: val } : {}, { preserveState: true, preserveScroll: true });
  };

  return (
    <main className="w-full">
      {/* hero same look */}
      <div className="w-full pt-6 sm:pt-8 lg:pt-12">
        <div className="relative mx-4 sm:mx-6 lg:mx-8 mb-8 sm:mb-10 lg:mb-14 rounded-2xl bg-gradient-to-r from-[#203b8a] via-[#2a4db3] to-[#3560dc] min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] overflow-visible">
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1080&q=80"
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#203b8a]/85 to-[#3560dc]/70" />
          </div>
          <div className="relative z-10 h-full flex items-center justify-center text-white text-center py-10 px-4">
            <div className="max-w-5xl w-full space-y-6">
              <div className="hidden sm:flex justify-center">
                <div className="inline-flex items-center bg-white/25 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20">
                  <i className="fas fa-newspaper text-yellow-300 mr-2 text-base" />
                  <span className="text-base font-medium">Management Article</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Management Article</h1>

              {/* filter bar + rubrik select */}
              <div className="pt-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="flex flex-col items-center gap-4">
                    {/* rubrik select */}
                    <div className="w-full max-w-2xl">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                        <label className="text-sm text-white/90 sm:text-right sm:pr-2">Filter Rubrik</label>
                        <select
                          value={rubrikId}
                          onChange={onRubrikChange}
                          className="sm:col-span-2 w-full bg-white/20 text-white border border-white/20 rounded-full py-2.5 px-4 focus:outline-none"
                          disabled={rubriks.length <= 1}
                        >
                          <option value="">Semua Rubrik</option>
                          {rubriks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* status filter buttons */}
                    <div className="hidden sm:flex flex-wrap items-center justify-center gap-2">
                      {(['semua','publish','draft','review','rejected'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setActiveFilter(f)}
                          className={`font-semibold py-2 px-4 rounded-full text-sm ${activeFilter === f ? 'bg-white text-[#203b8a] shadow-md' : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'}`}
                        >
                          {({semua:'Semua',publish:'Publish',draft:'Draft',review:'Review',rejected:'Ditolak'} as any)[f]} ({counts[f]})
                        </button>
                      ))}
                    </div>

                    {/* search */}
                    <div className="w-full max-w-2xl">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <i className="fas fa-search text-white/60" />
                        </span>
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Cari judul artikel…"
                          className="w-full bg-white/20 border border-white/20 text-white placeholder-white/60 rounded-full py-2.5 pl-10 pr-4"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <i className="fas fa-newspaper text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada artikel</h3>
              <p className="text-gray-600">Ubah filter untuk melihat artikel lain.</p>
            </div>
          ) : (
            visible.map(a => (
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
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      {badge(a.status)}
                    </div>
                    <h2 className="text-xl font-bold mb-1 text-gray-900 hover:text-[#203b8a]">
                      <Link href={`/admin/articles/${a.id}`}>{a.title}</Link>
                    </h2>
                    {!!a.description && <p className="text-sm text-gray-600">{a.description}</p>}

                    <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-500">
                      <span className="font-medium">Terakhir diperbarui: {a.createdDate}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-5 py-3 flex justify-end">
                  <Link href={`/admin/articles/${a.id}`} className="text-sm font-semibold text-[#203b8a] hover:underline">
                    Kelola &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}

          {visibleCount < filtered.length && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleCount(v => v + 10)}
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