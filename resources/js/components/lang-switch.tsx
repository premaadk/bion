import React from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion } from 'motion/react';

// Definisikan tipe untuk page props agar TypeScript tahu tentang 'locale'
interface PageProps {
  locale: 'id' | 'en';
}

export function LanguageSwitcher() {
  // Ambil locale langsung dari shared props Inertia
  const { props } = usePage<PageProps>();
  const currentLanguage = props.locale ?? 'id';

  // Fungsi untuk menangani pergantian bahasa via Inertia router
  const handleLanguageToggle = () => {
    const newLang = currentLanguage === 'id' ? 'en' : 'id';
    // Kunjungi route di backend yang akan mengubah sesi locale
    router.get(`/lang/${newLang}`, {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={handleLanguageToggle}
        className="relative w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden cursor-pointer flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203b8a]"
        title={currentLanguage === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      >
        {/* === Latar Belakang Bendera === */}
        <div className="absolute inset-0">
          {/* Bendera Indonesia - Sisi Kiri */}
          <motion.div
            className="absolute left-0 top-0 w-1/2 h-full"
            initial={false}
            animate={{
              filter: currentLanguage === 'id' ? 'grayscale(0)' : 'grayscale(1)',
              opacity: currentLanguage === 'id' ? 1 : 0.5,
            }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className="w-full h-1/2 bg-[#E70000]"></div>
            <div className="w-full h-1/2 bg-white"></div>
          </motion.div>

          {/* Bendera Inggris (Union Jack) - Sisi Kanan */}
          <motion.div
            className="absolute right-0 top-0 w-1/2 h-full overflow-hidden"
            initial={false}
            animate={{
              filter: currentLanguage === 'en' ? 'grayscale(0)' : 'grayscale(1)',
              opacity: currentLanguage === 'en' ? 1 : 0.5,
            }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            {/* SVG Union Jack dipotong setengah secara visual oleh parent div */}
            <div className="absolute right-0 top-0 w-[200%] h-full">
              <svg viewBox="0 0 60 30" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <rect width="60" height="30" fill="#012169" />
                <path d="M 0,0 L 60,30 M 60,0 L 0,30" stroke="white" strokeWidth="6" />
                <path d="M 0,0 L 60,30 M 60,0 L 0,30" stroke="#C8102E" strokeWidth="4" />
                <rect x="0" y="12" width="60" height="6" fill="white" />
                <rect x="27" y="0" width="6" height="30" fill="white" />
                <rect x="0" y="13" width="60" height="4" fill="#C8102E" />
                <rect x="28" y="0" width="4" height="30" fill="#C8102E" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* === Indikator Bahasa di Tengah === */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center shadow-md border border-gray-200/50">
            <span className="text-black font-bold text-[10px]">
              {currentLanguage === 'id' ? 'ID' : 'EN'}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}