import { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { AppsDropdown } from '@/components/header/desktop/apps-dropdown';
import { ChatDropdown } from '@/components/header/desktop/chat-dropdown';
import { FriendRequestsDropdown } from '@/components/header/desktop/friend-requests-dropdown';
import { LanguageSwitcher } from '@/components/lang-switch';
import { NotificationsDropdown } from '@/components/header/desktop/notifications-dropdown';
import { ProfileDropdown } from '@/components/header/desktop/profile-dropdown';
import { Breadcrumbs } from './breadcrumbs';
import { RubrikSubmenu } from './rubrik-submenu';
import { MobileModals } from './mobile';
import type { BreadcrumbItem, PageProps, SearchTerms, LoadedCounts } from './header-types';

// NEW: Define the props the component will receive from its parent
interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  activePage: string;
  onNavigation: (page: string) => void;
}

const allNavItems = [
    { title: 'Home', page: 'home' },
    { title: 'Popular', page: 'popular' },
    { title: 'Sections', page: 'sections' },
    { title: 'Gallery', page: 'gallery' },
    { title: 'SayHello!', page: 'sayhello!' },
];

// NEW: Update the function signature to accept the new props
export function AppHeader({ breadcrumbs = [], activePage, onNavigation }: AppHeaderProps) {
    const { props } = usePage<PageProps>();
    const { auth, apps = [], chats = [], friendRequests = [], notifications = [] } = props;

    // State management (everything EXCEPT activePage)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isRubrikSubmenuOpen, setRubrikSubmenuOpen] = useState(false);
    const [searchTerms, setSearchTerms] = useState<SearchTerms>({ friendRequests: '', chats: '', notifications: '', apps: '' });
    const [loadedCounts, setLoadedCounts] = useState<LoadedCounts>({ friendRequests: 5, chats: 8, notifications: 5, apps: 10 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-dropdown-container]') && !target.closest('[data-rubrik-container]') && !target.closest('[data-mobile-modal]')) {
                setActiveDropdown(null);
                setRubrikSubmenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeAllDropdowns = () => setActiveDropdown(null);

    // NEW: The handleNavigation function now calls the prop from the parent
    const handleNavigation = (page: string) => {
        onNavigation(page);
        setRubrikSubmenuOpen(false);
        closeAllDropdowns();
    };

    const handleToggleDropdown = (dropdownName: string) => {
        setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
        setRubrikSubmenuOpen(false);
    };

    const handleSearch = (type: keyof SearchTerms, term: string) => {
        setSearchTerms(prev => ({ ...prev, [type]: term }));
    };

    const handleLoadMore = (type: keyof LoadedCounts) => {
        setLoadedCounts(prev => ({...prev, [type]: prev[type] + 5}));
    }

    return (
        <>
            <header className="border-b border-sidebar-border/80 bg-white shadow-sm sticky top-0 z-40">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="flex-shrink-0">
                            <img src="https://bion.arora.id/wp-content/uploads/2025/06/Logo-BION-Color-scaled.png" alt="BION Logo" className="h-10 w-auto" />
                        </Link>
                    </div>
                    <nav className="hidden md:flex h-full items-baseline space-x-8 text-gray-600 font-semibold">
                         {allNavItems.map((item) => (
                            item.page === 'sections' ? (
                                <RubrikSubmenu key={item.page} isOpen={isRubrikSubmenuOpen} onRubrikClick={() => { setRubrikSubmenuOpen(!isRubrikSubmenuOpen); setActiveDropdown(null); }} onRubrikNavigation={handleNavigation} activePage={activePage} />
                            ) : (
                                <button key={item.page} onClick={() => handleNavigation(item.page)} className={`hover:text-[#203b8a] transition-colors h-full flex items-center border-b-2 ${activePage === item.page ? 'text-[#203b8a] border-[#203b8a]' : 'border-transparent'}`}>
                                    {item.title}
                                </button>
                            )
                        ))}
                    </nav>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <AppsDropdown isActive={activeDropdown === 'apps'} onToggle={() => handleToggleDropdown('apps')} apps={apps} searchTerm={searchTerms.apps} onSearch={(term) => handleSearch('apps', term)} loadedCount={loadedCounts.apps} onLoadMore={() => handleLoadMore('apps')} onAppNavigation={(appName) => console.log(`Nav to app ${appName}`)} />
                        <FriendRequestsDropdown isActive={activeDropdown === 'friendRequests'} onToggle={() => handleToggleDropdown('friendRequests')} friendRequests={friendRequests} searchTerm={searchTerms.friendRequests} onSearch={(term) => handleSearch('friendRequests', term)} loadedCount={loadedCounts.friendRequests} onLoadMore={() => handleLoadMore('friendRequests')} onSearchFriends={() => console.log('search friends')} />
                        <ChatDropdown isActive={activeDropdown === 'messenger'} onToggle={() => handleToggleDropdown('messenger')} chats={chats} searchTerm={searchTerms.chats} onSearch={(term) => handleSearch('chats', term)} loadedCount={loadedCounts.chats} onLoadMore={() => handleLoadMore('chats')} onChatClick={(chat) => console.log('Chat clicked:', chat)} onExpandClick={() => console.log('Expand chat clicked')} />
                        <NotificationsDropdown isActive={activeDropdown === 'notifications'} onToggle={() => handleToggleDropdown('notifications')} notifications={notifications} searchTerm={searchTerms.notifications} onSearch={(term) => handleSearch('notifications', term)} loadedCount={loadedCounts.notifications} onLoadMore={() => handleLoadMore('notifications')} />
                        <LanguageSwitcher />
                        <ProfileDropdown isActive={activeDropdown === 'profile'} onToggle={() => handleToggleDropdown('profile')} user={auth.user} />
                    </div>
                </div>
            </header>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex w-full border-b border-sidebar-border/70 bg-white">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
            <MobileModals
                activeDropdown={activeDropdown}
                closeAllDropdowns={closeAllDropdowns}
                friendRequestsData={friendRequests}
                chatsData={chats}
                notificationsData={notifications}
                appsData={apps}
                searchTerms={searchTerms}
                loadedCounts={loadedCounts}
                user={auth.user}
                onSearch={handleSearch}
                onLoadMore={handleLoadMore}
                onAppsNavigation={(appName) => console.log(`Navigating to app: ${appName}`)}
                onChatClick={(chat) => console.log('Opening chat with:', chat.name)}
                onProfileNavigation={(page) => console.log('Navigating to profile page:', page)}
                onLogout={() => console.log('Logging out...')}
                onSearchFriends={() => console.log('Searching for friends...')}
            />
        </>
    );
}