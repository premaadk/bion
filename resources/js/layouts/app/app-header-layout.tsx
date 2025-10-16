import { useState, useEffect, PropsWithChildren } from 'react';
import { usePage, router } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/header/app-header';
import { AppShell } from '@/components/app-shell';
import { MobileNav } from '@/components/mobile-nav/index'; // NEW: Import MobileNav
import { type BreadcrumbItem } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { url } = usePage();

    // NEW: State for the active page is managed here
    const [activePage, setActivePage] = useState('home');

    // NEW: Effect to sync the active page with the current URL
    useEffect(() => {
        const currentPath = url.split('?')[0];
        if (currentPath.includes('/popular')) setActivePage('popular');
        else if (currentPath.includes('/sections')) setActivePage('sections');
        else if (currentPath.includes('/gallery')) setActivePage('gallery');
        else if (currentPath.includes('/sayhello')) setActivePage('sayhello!');
        else setActivePage('home');
    }, [url]);

    // NEW: Navigation handlers to be passed down
    const handleNavigation = (page: string) => {
        console.log(`Layout: Navigating to page: ${page}`);
        // router.visit(route(page)); // Your actual Inertia navigation
        setActivePage(page);
    };

    const handleRubrikNavigation = (slug: string) => {
        console.log(`Layout: Navigating to section: ${slug}`);
        // router.visit(route('sections.show', { slug })); // Your actual Inertia navigation
        setActivePage('sections');
    };

    return (
        <AppShell>
            {/* NEW: Pass state and handlers down to AppHeader */}
            <AppHeader
                breadcrumbs={breadcrumbs}
                activePage={activePage}
                onNavigation={handleNavigation}
            />

            {/* The main content of your page */}
            {/* The `pb-16 md:pb-0` is handled by AppShell or AppContent */}
            <AppContent>{children}</AppContent>

            {/* NEW: Render the MobileNav component */}
            <MobileNav
                activePage={activePage}
                onNavigation={handleNavigation}
                onRubrikNavigation={handleRubrikNavigation}
            />
        </AppShell>
    );
}