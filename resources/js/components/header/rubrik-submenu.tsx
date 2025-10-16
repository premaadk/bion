import React, { useState, useRef, useEffect } from 'react';

interface RubrikSubmenuProps {
    isOpen: boolean;
    onRubrikClick: () => void;
    onRubrikNavigation: (pageName: string) => void;
    activePage: string;
}

export function RubrikSubmenu({ isOpen, onRubrikClick, onRubrikNavigation, activePage }: RubrikSubmenuProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const submenuItems = [
        { name: 'Transformation' }, { name: 'Food Corner' }, { name: 'Business Lens' },
        { name: 'Informasiana' }, { name: 'Perspective' }, { name: 'Bulog Cares' },
        { name: 'Opinion' }, { name: 'Local Wisdom' }, { name: 'Inspiring Profiles' },
        { name: 'Community' }, { name: 'Entertainment' }
    ];

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            setTimeout(() => {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current!;
                setCanScrollLeft(scrollLeft > 5);
                setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
            }, 50);
        }
    };

    const scroll = (direction: number) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 320 * direction;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (isOpen && container) {
            checkScrollButtons();
            container.addEventListener('scroll', checkScrollButtons);
            window.addEventListener('resize', checkScrollButtons);
            return () => {
                container.removeEventListener('scroll', checkScrollButtons);
                window.removeEventListener('resize', checkScrollButtons);
            };
        }
    }, [isOpen]);

    return (
        <div data-rubrik-container className="group h-full flex items-center">
            {/* === PERUBAHAN UTAMA ADA DI BUTTON INI === */}
            <button 
                onClick={onRubrikClick} 
                // 1. Tambahkan `relative` dan padding-bottom `pb-3`
                className={`relative font-semibold hover:text-[#203b8a] focus:outline-none h-full flex items-center px-2 transition-colors border-b-2 pb-2 ${isOpen || activePage === 'sections' ? 'text-[#203b8a] border-[#203b8a]' : 'text-gray-600 border-transparent'}`}
            >
                {/* 2. Hanya teks, yang akan ter-align secara otomatis */}
                <span>Sections</span>
                
                {/* 3. Ikon panah dengan positioning absolut */}
                <i 
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 fas fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}
                ></i>
            </button>
            
            {isOpen && (
                <div className="fixed top-[3.5rem] left-0 right-0 bg-white shadow-lg border-t z-[60]">
                    <div className="max-w-6xl mx-auto w-full px-6 relative flex items-center">
                        <button onClick={() => scroll(-1)} disabled={!canScrollLeft} className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 flex items-center justify-center shadow-lg border bg-white/95 backdrop-blur-sm hover:bg-gray-100 disabled:opacity-0 disabled:pointer-events-none z-10`}><i className="fas fa-chevron-left text-sm text-gray-600"></i></button>
                        <div ref={scrollContainerRef} className="overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <div className="flex items-center justify-start gap-2 min-w-max px-4 py-2">
                                {submenuItems.map((item) => (
                                    <button key={item.name} onClick={() => onRubrikNavigation(item.name)} className="flex flex-col items-center justify-center px-4 py-3 text-gray-700 hover:text-[#203b8a] hover:bg-gray-50 rounded-lg transition-colors group">
                                        <span className="text-xs leading-tight text-center font-medium">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => scroll(1)} disabled={!canScrollRight} className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 flex items-center justify-center shadow-lg border bg-white/95 backdrop-blur-sm hover:bg-gray-100 disabled:opacity-0 disabled:pointer-events-none z-10`}><i className="fas fa-chevron-right text-sm text-gray-600"></i></button>
                    </div>
                </div>
            )}
        </div>
    );
}