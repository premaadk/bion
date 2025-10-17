import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { PageHero } from "@/components/page-hero";
import authorRoutes from "@/routes/articles";         // Wayfinder: resource author (non-admin)
import adminArticleRoutes from "@/routes/admin/articles"; // Wayfinder: admin submit action
import {
  FileText,
  Search,
  Plus,
  CalendarClock,
  Layers,
  Building2,
  Eye,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  FolderOpenDot,
} from "lucide-react";

/* ================= Types ================= */
type Id = string | number;

type ArticleRow = {
  id: Id;
  title: string;
  slug?: string | null;
  status:
    | "draft"
    | "submitted"
    | "review_editor"
    | "revision"
    | "revised"
    | "approved"
    | "review_admin"
    | "rejected"
    | "published"
    | string;
  rubrik?: string | null;
  division?: string | null;
  author_id?: Id | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PageProps = {
  articles: ArticleRow[];
  // optional, kalau kamu expose auth user via props.auth.user (Breeze/Fortify)
  auth?: { user?: { id: Id; name?: string } };
  me?: { id: Id; name?: string }; // fallback kalau kamu kirim eksplisit "me"
};

/* ============== Wayfinder types (longgar) ============== */
type WFArticles = {
  index: { url: () => string };
  create: { url: () => string };
  show: { url: (p: { article: Id }) => string };
  edit: { url: (p: { article: Id }) => string };
  destroy: { url: (p: { article: Id }) => string };
};
type WFAdminArticles = {
  submit: { url: (p: { article: Id }) => string };
};

const wf = authorRoutes as unknown as WFArticles;
const wfAdmin = adminArticleRoutes as unknown as WFAdminArticles;

/* ================= Utils ================= */
const toDate = (val?: string | number | Date | null): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val);
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return new Date(s.length === 10 ? n * 1000 : n);
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s.replace(" ", "T") + "Z");
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const fmtDate = (value?: string | null) => {
  const d = toDate(value ?? undefined);
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return value ?? "—";
  }
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  review_editor: "Review by Editor",
  revision: "Revision",
  revised: "Revised",
  approved: "Approved",
  review_admin: "Review by Admin",
  rejected: "Rejected",
  published: "Published",
};

const statusClass: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-indigo-100 text-indigo-800",
  review_editor: "bg-amber-100 text-amber-800",
  revision: "bg-yellow-100 text-yellow-800",
  revised: "bg-cyan-100 text-cyan-800",
  approved: "bg-emerald-100 text-emerald-800",
  review_admin: "bg-orange-100 text-orange-800",
  rejected: "bg-red-100 text-red-800",
  published: "bg-green-100 text-green-800",
};

/* ================= Page ================= */
export default function Index() {
  const { url, props } = usePage<PageProps>() as any;
  const p = (props as PageProps) ?? {};
  const allArticles = p.articles ?? [];

  // ambil user id dari props.auth.user atau props.me
  const myId = (p.auth?.user?.id ?? p.me?.id) as Id | undefined;

  // SAFETY LAYER: meskipun backend seharusnya sudah filter,
  // kita tetap batasi di FE supaya "hanya artikel saya" yang muncul.
  const myArticles = useMemo(() => {
    if (!myId) return allArticles; // jika tidak tersedia, anggap backend sudah filter
    return allArticles.filter((a) =>
      a.author_id == null ? true : String(a.author_id) === String(myId)
    );
  }, [allArticles, myId]);

  // ---- Stats (Hero) ----
  const totalMine = myArticles.length;
  const totalPublished = myArticles.filter((a) => a.status === "published").length;

  // ---- Tabs ----
  const isIndex = url.startsWith("/articles") && !/\/create|\/\d+\/(edit|show)/.test(url);
  const isCreate = /\/articles\/create/.test(url);

  // ---- Filters ----
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return myArticles.filter((a) => {
      const m =
        !t ||
        a.title.toLowerCase().includes(t) ||
        (a.rubrik ?? "").toLowerCase().includes(t) ||
        (a.division ?? "").toLowerCase().includes(t);
      const s = !statusFilter || a.status === statusFilter;
      return m && s;
    });
  }, [myArticles, term, statusFilter]);

  // ---- Actions (Author rules) ----
  const canEdit = (a: ArticleRow) => a.status === "draft" || a.status === "revision";
  const canDelete = (a: ArticleRow) => a.status === "draft";
  const canSubmit = (a: ArticleRow) => a.status === "draft"; // revision = hanya RU (tidak submit)

  const onDelete = (a: ArticleRow) => {
    if (!canDelete(a)) return;
    if (!confirm(`Hapus artikel "${a.title}"?`)) return;
    router.delete(wf.destroy.url({ article: a.id }), {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const onSubmit = (a: ArticleRow) => {
    if (!canSubmit(a)) return;
    if (!confirm(`Submit artikel "${a.title}" untuk ditinjau Editor?`)) return;
    // submit route ada di admin prefix: admin.articles.submit
    router.post(
      (wfAdmin.submit as { url: (p: { article: Id }) => string }).url({ article: a.id }),
      {},
      { preserveScroll: true }
    );
  };

  return (
    <AppLayout>
      <Head title="My Articles" />

      <PageHero
        badge={{ text: "My Article", icon: <FileText className="h-4 w-4" /> }}
        title="Artikelku"
        description="Kelola artikelmu: buat draft, edit, dan kirim untuk ditinjau."
        gradient={{
          from: "#203b8a",
          via: "#2a4db3",
          to: "#3560dc",
          direction: "to right",
          overlayOpacity: 0.66,
        }}
        media={{ imageUrl: "/images/hero/abstract-wave.jpg", objectPosition: "center", dimOpacity: 0.2 }}
        stats={[
          { value: totalMine, label: "Total", icon: <FolderOpenDot className="h-5 w-5" /> },
          { value: filtered.length, label: "Filtered", icon: <CheckCircle2 className="h-5 w-5" /> },
          { value: totalPublished, label: "Published", icon: <CheckCircle2 className="h-5 w-5" /> },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+96px)] md:pb-8">
        {/* ===== Tabs — Mobile ===== */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Link
              href={wf.index.url()}
              className={`flex flex-col items-center justify-center gap-1 py-3 ${
                isIndex ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isIndex ? "page" : undefined}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">My Articles</span>
            </Link>
            <Link
              href={wf.create.url()}
              className={`flex flex-col items-center justify-center gap-1 border-l py-3 ${
                isCreate ? "bg-[#1f3b8a] text-white" : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
              aria-current={isCreate ? "page" : undefined}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">Create</span>
            </Link>
          </div>
        </div>

        {/* ===== Tabs — Desktop ===== */}
        <div className="hidden md:flex mb-6 gap-2">
          <Link
            href={wf.index.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isIndex ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FileText className="h-5 w-5" />
            My Articles
          </Link>
          <Link
            href={wf.create.url()}
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${
              isCreate ? "bg-[#1f3b8a] text-white border-[#1f3b8a]" : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Plus className="h-5 w-5" />
            Create Article
          </Link>
        </div>

        {/* ===== Toolbar ===== */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari judul/rubrik/division…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>

            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm outline-none ring-0 focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              {[
                "draft",
                "submitted",
                "review_editor",
                "revision",
                "revised",
                "approved",
                "review_admin",
                "rejected",
                "published",
              ].map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s] ?? s}
                </option>
              ))}
            </select>

            <div className="flex items-center md:justify-end">
              <Link
                href={wf.create.url()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f3b8a] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                New Article
              </Link>
            </div>
          </div>
        </div>

        {/* ===== Desktop table ===== */}
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-6 py-4 font-medium text-gray-700">Title</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Rubrik</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Division</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Updated</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => {
                  const s = String(a.status || "draft");
                  return (
                    <tr key={String(a.id)} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{a.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass[s] ?? "bg-gray-100 text-gray-800"}`}>
                          {statusLabel[s] ?? s}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          <Layers className="h-3.5 w-3.5" /> {a.rubrik ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          <Building2 className="h-3.5 w-3.5" /> {a.division ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarClock className="h-4 w-4 text-gray-400" />
                          {fmtDate(a.updated_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={wf.show.url({ article: a.id })}
                            className="rounded p-1 text-gray-500 hover:text-indigo-600"
                            title="View"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>

                          {canEdit(a) && (
                            <Link
                              href={wf.edit.url({ article: a.id })}
                              className="rounded p-1 text-gray-500 hover:text-indigo-600"
                              title="Edit"
                            >
                              <Pencil className="h-5 w-5" />
                            </Link>
                          )}

                          {canSubmit(a) && (
                            <button
                              onClick={() => onSubmit(a)}
                              className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
                              title="Submit for review"
                            >
                              <Send className="h-5 w-5" />
                            </button>
                          )}

                          {canDelete(a) && (
                            <button
                              onClick={() => onDelete(a)}
                              className="rounded p-1 text-gray-500 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-14 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Belum ada artikel.</p>
            </div>
          )}
        </div>

        {/* ===== Mobile cards ===== */}
        <div className="space-y-4 md:hidden">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">Belum ada artikel.</p>
            </div>
          ) : (
            filtered.map((a) => {
              const s = String(a.status || "draft");
              return (
                <div key={String(a.id)} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-gray-900">{a.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded px-2 py-1 font-medium ${statusClass[s] ?? "bg-gray-100 text-gray-800"}`}>
                          {statusLabel[s] ?? s}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          <Layers className="h-3.5 w-3.5" /> {a.rubrik ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                          <Building2 className="h-3.5 w-3.5" /> {a.division ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2 flex items-center gap-1">
                      <Link
                        href={wf.show.url({ article: a.id })}
                        className="rounded p-2 text-gray-500 hover:text-indigo-600"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      {canEdit(a) && (
                        <Link
                          href={wf.edit.url({ article: a.id })}
                          className="rounded p-2 text-gray-500 hover:text-indigo-600"
                          title="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </Link>
                      )}
                      {canSubmit(a) && (
                        <button
                          onClick={() => onSubmit(a)}
                          className="rounded p-2 text-indigo-600 hover:bg-indigo-50"
                          title="Submit for review"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      )}
                      {canDelete(a) && (
                        <button
                          onClick={() => onDelete(a)}
                          className="rounded p-2 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-xs text-gray-500">
                    Updated: {fmtDate(a.updated_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}