import React from 'react';

// Definisikan tipe data untuk sebuah aplikasi, tambahkan 'path'
type App = {
    category: string;
    name: string;
    icon: string;
    path: string; // Properti untuk menyimpan URL atau rute navigasi
};

// Definisikan props yang dibutuhkan oleh komponen ini
interface AppsDropdownProps {
    isActive: boolean;
    onToggle: () => void;
    apps: App[];
    searchTerm: string;
    onSearch: (term: string) => void;
    loadedCount: number;
    onLoadMore: () => void;
    onAppNavigation: (appPath: string) => void; // Prop sekarang menerima path (string)
}

export function AppsDropdown({ 
    isActive, 
    onToggle, 
    apps: initialApps,
    searchTerm, 
    onSearch, 
    loadedCount, 
    onLoadMore, 
    onAppNavigation 
}: AppsDropdownProps) {

    // NOTE: Idealnya, semua data aplikasi (termasuk path) 
    // dikirim melalui prop `initialApps` dari komponen induk.
    // Penambahan data di sini adalah untuk tujuan demonstrasi.
    const allApps: App[] = [
        ...initialApps,
        // Contoh penambahan role lain sebelum Super Admin
        { category: 'Publisher', name: 'Publish Queue', icon: 'fas fa-paper-plane', path: '/publisher/queue' },

        // Menambahkan menu baru pada Super Admin
        { category: 'Super Admin', name: 'Management Articles', icon: 'fas fa-file-alt', path: '/admin/articles' },
        { category: 'Super Admin', name: 'Management Roles', icon: 'fas fa-user-tag', path: '/admin/roles' },
        { category: 'Super Admin', name: 'Management Permissions', icon: 'fas fa-shield-alt', path: '/admin/permissions' },
        { category: 'Super Admin', name: 'Management Rubriks', icon: 'fas fa-newspaper', path: '/admin/rubriks' },
        { category: 'Super Admin', name: 'Management Division', icon: 'fas fa-sitemap', path: '/admin/divisions' },
        { category: 'Super Admin', name: 'Management Users', icon: 'fas fa-users-cog', path: '/admin/users' }
    ];

    const filteredApps = allApps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const displayedApps = filteredApps.slice(0, loadedCount);
    const hasMoreApps = filteredApps.length > loadedCount;
    
    // Menambahkan kategori role baru ke dalam urutan
    const categories = ['All Role', 'Author', 'Editor Rubrik', 'Admin Rubrik', 'Publisher', 'Super Admin'];

    return (
        <div className="relative" data-dropdown-container="apps">
            <button
                onClick={onToggle}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#d3e2fd] text-[#203b8a]' : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
                <i className="fas fa-th text-sm lg:text-lg"></i>
            </button>

            {isActive && (
                <div className="hidden md:block absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60]">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold">Apps</h3>
                            <button className="text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                                <i className="fas fa-ellipsis-h text-sm"></i>
                            </button>
                        </div>
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search in Apps"
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#203b8a] text-sm"
                                value={searchTerm}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col h-96">
                        <div className="flex-1 overflow-y-auto px-2 pt-1">
                            {categories.map(category => {
                                const categoryApps = displayedApps.filter(app => app.category === category);
                                if (categoryApps.length === 0) return null;

                                return (
                                    <div key={category} className="mb-4">
                                        <p className="px-2 pt-2 pb-1 text-xs font-bold text-gray-500 uppercase">{category}</p>
                                        <div className="space-y-1">
                                            {categoryApps.map((app, index) => (
                                                <button
                                                    key={index}
                                                    // Panggil onAppNavigation dengan path aplikasi saat tombol diklik
                                                    onClick={() => onAppNavigation(app.path)}
                                                    className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md w-full text-left transition-colors"
                                                >
                                                    <i className={`${app.icon} w-6 mr-3 text-center`}></i>
                                                    <span>{app.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredApps.length === 0 && searchTerm && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm">No applications found</p>
                                </div>
                            )}
                        </div>

                        {filteredApps.length > 0 && (
                            <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white rounded-b-lg">
                                <button
                                    onClick={onLoadMore}
                                    disabled={!hasMoreApps}
                                    className={`w-full text-center text-sm py-2 rounded-lg font-semibold transition-colors ${
                                        hasMoreApps
                                            ? 'text-[#203b8a] hover:bg-gray-100 cursor-pointer'
                                            : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {hasMoreApps ? 'View More Apps' : 'All applications loaded'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

