export interface RubrikSubmenuItem {
  icon: string;
  name: string;
  slug: string;
}

export interface MobileNavProps {
  isRubrikSubmenuOpen: boolean;
  onRubrikClick: () => void;
  activePage: string;
  onNavigation: (page: string) => void;
  onRubrikNavigation: (rubrikSlug: string) => void;
}

export interface BottomNavProps {
  activePage: string;
  isRubrikSubmenuOpen: boolean;
  onNavClick: (page: string) => void;
  onRubrikClick: () => void;
}

export interface RubrikSubmenuProps {
  isOpen: boolean;
  items: RubrikSubmenuItem[];
  onItemClick: (slug: string) => void;
}