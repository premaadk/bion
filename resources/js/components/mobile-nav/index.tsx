import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { MobileNavProps } from './nav-types';
import { rubrikSubmenuItems } from './nav-data';
import { RubrikSubmenu } from './rubrik-submenu';
import { BottomNav } from './bottom-nav';

export function MobileNav({
  activePage,
  onNavigation,
  onRubrikNavigation,
}: Omit<MobileNavProps, 'isRubrikSubmenuOpen' | 'onRubrikClick'>) {
  const [isRubrikOpen, setIsRubrikOpen] = useState(false);
  const page = usePage();

  // Close rubrik submenu on route change
  useEffect(() => {
    setIsRubrikOpen(false);
  }, [page.url]);

  const handleRubrikClick = () => {
    setIsRubrikOpen(prev => !prev);
  };

  const handleSubmenuItemClick = (slug: string) => {
    onRubrikNavigation(slug);
    setIsRubrikOpen(false);
  };

  const handleNavClick = (pageName: string) => {
    onNavigation(pageName);
    if (isRubrikOpen) {
      setIsRubrikOpen(false);
    }
  };
  
  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isRubrikOpen && !target.closest('[data-submenu-area="true"]') && !target.closest('[data-rubrik-button="true"]')) {
        setIsRubrikOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isRubrikOpen]);

  return (
    <>
      <RubrikSubmenu
        isOpen={isRubrikOpen}
        items={rubrikSubmenuItems}
        onItemClick={handleSubmenuItemClick}
      />
      <BottomNav
        activePage={activePage}
        isRubrikSubmenuOpen={isRubrikOpen}
        onNavClick={handleNavClick}
        onRubrikClick={handleRubrikClick}
      />
    </>
  );
}

// Re-export types and data for external use
export * from './nav-types';
export { rubrikSubmenuItems } from './nav-data';