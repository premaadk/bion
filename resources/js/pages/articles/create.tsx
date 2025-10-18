// resources/js/pages/articles/create.tsx
import React, { useMemo, useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PageHero from '@/components/page-hero';
import { ShieldCheck } from 'lucide-react';
import QuillEditor from '@/components/quill-editor';

type RubrikOption = { id: number; name: string };

type CreatePageProps = {
  rubriks: RubrikOption[];
};

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

/**
 * Resize image to reasonable size to avoid gigantic base64 and broken previews.
 * Keeps aspect ratio. Returns DataURL string.
 */
async function resizeImageToDataUrl(file: File, maxW = 1600, maxH = 1200, quality = 0.9): Promise<string> {
  const isImage = file.type.startsWith('image/');
  if (!isImage) throw new Error('File bukan gambar');
  const blobURL = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = blobURL;
    });

    let { width, height } = img;
    const ratio = Math.min(maxW / width, maxH / height, 1); // shrink only
    const targetW = Math.round(width * ratio);
    const targetH = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia');

    ctx.drawImage(img, 0, 0, targetW, targetH);

    // pilih format output
    const type = /image\/(png|webp|jpe?g|gif)/i.test(file.type)
      ? (file.type.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg')
      : 'image/jpeg';

    const dataUrl = canvas.toDataURL(type, quality);
    return dataUrl;
  } finally {
    URL.revokeObjectURL(blobURL);
  }
}

export default function CreateArticlePage({ rubriks }: CreatePageProps) {
  // === UI Local States ===
  const [tagInput, setTagInput] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(''); // dataURL preview
  const [authorType, setAuthorType] = useState<'real_name' | 'anonymous'>('real_name');
  const [imageError, setImageError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === Inertia Form State ===
  const { data, setData, post, processing, errors, transform, reset } = useForm<{
    title: string;
    slug: string;
    rubrik_id: number | '';
    excerpt: string;
    content: string;
    is_anonymous: boolean;
    meta: { keywords: string[]; cover_data_url?: string };
    submit?: boolean;
  }>({
    title: '',
    slug: '',
    rubrik_id: '',
    excerpt: '',
    content: '',
    is_anonymous: false,
    meta: { keywords: [] },
    submit: false,
  });

  // === Helpers ===
  const keywords = useMemo(() => data.meta.keywords, [data.meta.keywords]);
  const setKeywords = (next: string[]) => setData('meta', { ...data.meta, keywords: next });

  const handleTagInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim();
      if (t.length && !keywords.includes(t)) setKeywords([...keywords, t]);
      setTagInput('');
    }
  };

  const removeTagAt = (idx: number) => {
    setKeywords(keywords.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (file: File) => {
    setImageError('');
    if (!file || !file.type.startsWith('image/')) {
      setImageError('File harus berupa gambar.');
      return;
    }
    // Batasi ~10MB untuk raw file
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Ukuran gambar melebihi 10MB. Pilih gambar lain.');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 1600, 1200, 0.9);
      setImagePreview(dataUrl);
      setData('meta', { ...data.meta, cover_data_url: dataUrl });
    } catch {
      setImageError('Gagal memproses gambar. Coba file lain.');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleImageUpload(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleImageUpload(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setImagePreview('');
    const { meta, ...rest } = data;
    const { cover_data_url, ...others } = meta;
    setData({ ...rest, meta: { ...others } });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-slug saat mengetik judul (slug non-editable di UI)
  const onTitleChange = (v: string) => {
    setData('title', v);
    setData('slug', slugify(v));
  };

  // === Kirim ===
  // Kita gunakan transform agar tidak bergantung pada timing setState.
  const finalizeTransform = (willSubmit: boolean) =>
    transform((payload) => {
      const cleanKeywords = Array.from(
        new Set((payload.meta?.keywords ?? []).map((t) => t.trim()).filter(Boolean))
      );

      return {
        ...payload,
        submit: willSubmit,
        // Pastikan anonym benar-benar dikirim:
        is_anonymous: authorType === 'anonymous',
        // Isi excerpt otomatis jika kosong:
        excerpt: payload.excerpt && payload.excerpt.trim().length
          ? payload.excerpt
          : computeExcerptFromHTML(payload.content || ''),
        // Pastikan cover_data_url terkirim (kalau user upload):
        meta: {
          ...payload.meta,
          keywords: cleanKeywords,
          cover_data_url: imagePreview || payload.meta?.cover_data_url,
        },
      };
    });

  const handleSaveDraft = () => {
    finalizeTransform(false);
    post('/articles', {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setImagePreview('');
        setAuthorType('real_name');
      },
    });
  };

  const handleSubmit = () => {
    finalizeTransform(true);
    post('/articles', { preserveScroll: true });
  };

  const handlePreview = () => {
    const title = data.title || 'Pratinjau Artikel';
    const html = data.content || '';
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;padding:24px;max-width:900px;margin:0 auto;line-height:1.7}
            img{max-width:100%;height:auto}
            h1,h2,h3{line-height:1.2}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${imagePreview ? `<p><img src="${imagePreview}" alt="Cover" /></p>` : ''}
          ${html}
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <AppLayout>
      <PageHero
        badge={{ text: 'Buat Artikel Baru', icon: <ShieldCheck className="h-4 w-4" /> }}
        title="Buat Artikel Baru"
        description="Buat Artikel Baru itu menyenangkan"
        gradient={{
          from: '#203b8a',
          via: '#2a4db3',
          to: '#3560dc',
          direction: 'to right',
          overlayOpacity: 0.66,
        }}
        media={{ imageUrl: '/images/hero/abstract-wave.jpg', objectPosition: 'center', dimOpacity: 0.2 }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Kiri */}
          <div className="lg:col-span-7 space-y-6">
            {/* Judul + Slug non-edit + Rubrik */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label htmlFor="article-title" className="block font-semibold text-gray-700 mb-2">
                Judul Artikel
              </label>
              <input
                id="article-title"
                type="text"
                value={data.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Masukkan judul yang menarik..."
                className="w-full border border-gray-300 rounded-lg p-4 text-2xl font-bold focus:outline-none focus:border-[#203b8a] focus:ring-2 focus:ring-[#203b8a]/30 transition-all"
              />
              {errors.title && <p className="text-sm text-red-600 mt-2">{errors.title}</p>}

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Slug (disabled) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Slug (otomatis)</label>
                  <input
                    type="text"
                    value={data.slug}
                    disabled
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Rubrik */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rubrik</label>
                  <select
                    value={data.rubrik_id}
                    onChange={(e) => setData('rubrik_id', e.target.value ? Number(e.target.value) : '')}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#203b8a] focus:ring-2 focus:ring-[#203b8a]/20"
                  >
                    <option value="">— Pilih Rubrik —</option>
                    {rubriks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {errors.rubrik_id && <p className="text-sm text-red-600 mt-1">{errors.rubrik_id}</p>}
                </div>
              </div>
            </div>

            {/* Image Cover (setelah judul) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block font-semibold text-gray-700 mb-2">Gambar Sampul</label>
              <div
                className={`relative rounded-lg p-8 text-center cursor-pointer border-2 border-dashed transition-all ${
                  isDragOver ? 'border-[#203b8a] bg-gray-50' : 'border-gray-300 hover:border-[#203b8a]'
                }`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={onFileChange}
                />

                {imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="Preview Gambar Sampul" className="max-h-80 mx-auto rounded-md" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      type="button"
                      className="mt-4 text-sm text-red-600 hover:underline"
                    >
                      Hapus Gambar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center items-center mb-4">
                      <i className="fas fa-cloud-upload-alt text-4xl text-gray-400" />
                    </div>
                    <p className="text-gray-600">
                      Seret & lepas gambar di sini, atau <span className="text-[#203b8a] font-semibold">klik untuk memilih file</span>.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG, GIF, WEBP hingga 10MB</p>
                  </div>
                )}
              </div>
              {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}
            </div>

            {/* Tags (setelah gambar) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label htmlFor="tags-input" className="block font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <div className="mb-2">
                {keywords.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-2"
                  >
                    {tag}
                    <button onClick={() => removeTagAt(i)} type="button" className="ml-2 text-gray-500 hover:text-gray-800">
                      <i className="fas fa-times" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                id="tags-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKey}
                placeholder="Tambahkan tag (mis: Digitalisasi, Teknologi) lalu tekan Enter"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#203b8a] focus:ring-2 focus:ring-[#203b8a]/30 transition-all"
              />
            </div>

            {/* Isi Artikel (setelah tag) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block font-semibold text-gray-700 mb-2">Isi Artikel</label>
              <QuillEditor
                className="mt-1 bg-white"
                value={data.content}
                onChange={(value) => {
                  setData('content', value);
                  setData('excerpt', computeExcerptFromHTML(value));
                }}
              />
              {errors.content && <p className="text-sm text-red-600 mt-2">{errors.content}</p>}
            </div>
          </div>

          {/* Kanan */}
          <div className="lg:col-span-3 space-y-6 lg:sticky top-20 self-start">
            {/* Status (statik untuk halaman create) */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-xl border-b pb-3 mb-4">Status Artikel</h3>
              <ul className="relative">
                <li className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
                <li className="flex items-center mb-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <i className="fas fa-check text-xs" />
                  </div>
                  <p className="ml-4 font-semibold text-sm text-gray-600">Draft</p>
                </li>
                <li className="flex items-center mb-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <p className="ml-4 font-semibold text-sm text-gray-400">Submitted</p>
                </li>
                <li className="flex items-center mb-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <p className="ml-4 font-semibold text-sm text-gray-400">Checking by Editor</p>
                </li>
                <li className="flex items-center mb-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <p className="ml-4 font-semibold text-sm text-gray-400">Revision</p>
                </li>
                <li className="flex items-center mb-4 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <p className="ml-4 font-semibold text-sm text-gray-400">Approved</p>
                </li>
                <li className="flex items-center relative z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <p className="ml-4 font-semibold text-sm text-gray-400">Published</p>
                </li>
              </ul>
            </div>

            {/* Panel Publikasi */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-bold text-xl border-b pb-3 mb-4">Publikasi</h3>

              {/* Penulis */}
              <div className="mb-4">
                <label className="block font-semibold text-gray-700 mb-2">Penulis</label>
                <div className="flex items-center space-x-4 p-1 bg-gray-100 rounded-lg">
                  <label className="flex-1 text-center py-2 px-3 rounded-md cursor-pointer text-sm font-semibold transition-all">
                    <input
                      type="radio"
                      name="author_type"
                      value="real_name"
                      checked={authorType === 'real_name'}
                      onChange={() => setAuthorType('real_name')}
                      className="sr-only"
                    />
                    <span className={`block ${authorType === 'real_name' ? 'bg-white shadow text-[#203b8a]' : ''}`}>Nama Asli</span>
                  </label>
                  <label className="flex-1 text-center py-2 px-3 rounded-md cursor-pointer text-sm font-semibold transition-all">
                    <input
                      type="radio"
                      name="author_type"
                      value="anonymous"
                      checked={authorType === 'anonymous'}
                      onChange={() => setAuthorType('anonymous')}
                      className="sr-only"
                    />
                    <span className={`block ${authorType === 'anonymous' ? 'bg-white shadow text-[#203b8a]' : ''}`}>Anonim</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  <i className="fas fa-eye mr-2" />
                  Pratinjau Artikel
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={processing}
                  className="text-gray-600 hover:text-[#203b8a] font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Simpan Draf
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={processing || !data.title || !data.rubrik_id}
                  className="bg-[#203b8a] hover:bg-[#182c69] text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all disabled:opacity-50"
                >
                  <i className="fas fa-paper-plane mr-2" />
                  Kirim Artikel
                </button>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
                  Periksa kembali form Anda. Beberapa field belum valid.
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              <Link href="/articles" className="hover:underline">
                &larr; Kembali ke daftar artikelnya
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}