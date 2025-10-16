// resources/js/components/header/dropdowns/profile-dropdown.tsx
import React from 'react';
import { Link } from '@inertiajs/react';

// Impor komponen Avatar dari UI library Anda (contoh: shadcn/ui)
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Tipe untuk data user, sesuaikan dengan data dari backend Anda
type User = {
    name: string;
    email: string;
    avatar: string | null; // Pastikan tipe data bisa menerima null
};

interface ProfileDropdownProps {
    isActive: boolean;
    onToggle: () => void;
    user: User;
}

// Helper function untuk mendapatkan inisial dari nama
const getInitials = (name: string = ''): string => {
    const names = name.trim().split(' ');
    if (names.length === 0 || names[0] === '') return '?';

    const firstInitial = names[0][0];
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
};


export function ProfileDropdown({ isActive, onToggle, user }: ProfileDropdownProps) {
    const onProfileNavigation = (page: string) => {
        console.log(`Navigating to profile page: ${page}`);
        // Ganti dengan Inertia.get(...) atau sejenisnya
    };

    return (
        <div className="relative" data-dropdown-container="profile">
            <button 
                onClick={onToggle} 
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full cursor-pointer flex items-center justify-center transition-all focus:outline-none ${isActive ? 'ring-2 ring-offset-2 ring-[#203b8a]' : ''}`}
            >
                {/* Avatar di Header */}
                <Avatar className="h-full w-full">
                    {/* PERUBAHAN UTAMA: Hanya render AvatarImage jika user.avatar memiliki nilai */}
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    
                    {/* Fallback akan otomatis muncul jika AvatarImage tidak dirender */}
                    <AvatarFallback className="text-sm bg-gray-200 text-gray-700 font-bold">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
            </button>

            {isActive && (
                <div className="hidden md:block absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[60]">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            {/* Avatar di dalam Dropdown Menu */}
                            <Avatar className="h-12 w-12">
                                {/* Diterapkan juga di sini */}
                                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                                <AvatarFallback className="bg-gray-200 text-gray-700 font-bold">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="py-2">
                        {/* Menu items */}
                        <button onClick={() => onProfileNavigation('profil')} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-user w-5 mr-3 text-gray-500"></i>My Profile</button>
                        <button onClick={() => onProfileNavigation('artikelku')} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-newspaper w-5 mr-3 text-gray-500"></i>My Articles</button>
                        <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><i className="fas fa-cog w-5 mr-3 text-gray-500"></i>Settings</button>
                    </div>
                    <div className="border-t border-gray-100 py-2">
                        <Link 
                            href="/logout" 
                            method="post" 
                            as="button" 
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <i className="fas fa-sign-out-alt w-5 mr-3"></i>Logout
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}