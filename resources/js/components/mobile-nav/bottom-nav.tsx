import { BottomNavProps } from './nav-types';

const navItems = [
  { page: 'home', icon: 'fas fa-home', label: 'Home' },
  { page: 'popular', icon: 'fas fa-fire', label: 'Popular' },
  { page: 'sections', icon: 'LOGO', label: 'Sections' }, // Placeholder for the special button
  { page: 'gallery', icon: 'fas fa-images', label: 'Gallery' },
  { page: 'sayhello!', icon: 'fas fa-comments', label: 'SayHello!' },
];

export function BottomNav({ activePage, isRubrikSubmenuOpen, onNavClick, onRubrikClick }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] h-16 bg-white shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] md:hidden">
      <div className="flex justify-around items-center h-full px-1">
        {navItems.map((item) => {
          if (item.icon === 'LOGO') {
            return (
              <button
                key={item.page}
                onClick={onRubrikClick}
                data-rubrik-button="true"
                // === PERUBAHAN UTAMA DI BAWAH INI ===
                // 1. Mengubah `justify-start` menjadi `justify-end` untuk mendorong konten ke bawah.
                // 2. Menambahkan `pb-1` untuk memberikan sedikit ruang dari bawah agar sejajar.
                className={`relative flex flex-col items-center justify-end text-center text-xs flex-1 -mt-8 pb-1 cursor-pointer ${
                  isRubrikSubmenuOpen || activePage === 'sections' ? 'text-[#203b8a]' : 'text-gray-600'
                }`}
              >
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all duration-300 border-4 ${
                  isRubrikSubmenuOpen ? 'bg-white border-[#203b8a]' : 'bg-[#203b8a] border-white'
                }`}>
                  <img
                    src="https://bion.arora.id/wp-content/uploads/2025/06/Logo-BION-Color-scaled.png"
                    alt="Sections"
                    className={`w-9 h-auto object-contain transition-all duration-300 pointer-events-none ${
                      !isRubrikSubmenuOpen ? 'brightness-0 invert' : ''
                    }`}
                  />
                </div>
                {/* 3. Menghapus `mt-1` dari span untuk kontrol posisi yang lebih baik. */}
                <span className="pointer-events-none">{item.label}</span>
              </button>
            );
          }

          return (
            <a
              key={item.page}
              href="#"
              onClick={(e) => { e.preventDefault(); onNavClick(item.page); }}
              className={`flex flex-col items-center justify-center text-center text-xs pt-1 pb-1 px-2 flex-1 transition-colors ${
                activePage === item.page && !isRubrikSubmenuOpen ? 'text-[#203b8a]' : 'text-gray-600'
              }`}
            >
              <i className={`${item.icon} text-xl mb-0.5`}></i>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}