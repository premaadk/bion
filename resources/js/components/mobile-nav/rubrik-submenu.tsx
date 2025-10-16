import { useRef, useEffect, useState } from 'react';
import { RubrikSubmenuProps } from './nav-types';

const checkScrollability = (container: HTMLElement) => {
  const { scrollLeft, scrollWidth, clientWidth } = container;
  const tolerance = 2;
  return {
    canScrollLeft: scrollLeft > tolerance,
    canScrollRight: scrollLeft + clientWidth < scrollWidth - tolerance,
  };
};

export function RubrikSubmenu({ isOpen, items, onItemClick }: RubrikSubmenuProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      setTimeout(() => setScrollState(checkScrollability(scrollRef.current!)), 100);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = (scrollRef.current.clientWidth / 3) * 3; // Scroll by 3 items
    scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      updateScrollButtons();
      window.addEventListener('resize', updateScrollButtons);
      scrollRef.current?.addEventListener('scroll', updateScrollButtons);
      return () => {
        window.removeEventListener('resize', updateScrollButtons);
        scrollRef.current?.removeEventListener('scroll', updateScrollButtons);
      };
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed bottom-16 left-0 right-0 bg-gray-100 pt-3 pb-8 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] md:hidden z-[55] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      data-submenu-area="true"
    >
      <div className="grid grid-cols-8 gap-x-1 items-center w-full px-2">
        <div className="col-span-1 flex justify-center">
          <button onClick={() => handleScroll('left')} disabled={!scrollState.canScrollLeft} className="group z-10 w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm shadow-md disabled:opacity-30 flex items-center justify-center transition hover:bg-[#203b8a]">
            <i className="fas fa-chevron-left text-lg text-[#203b8a] group-hover:text-white transition-colors"></i>
          </button>
        </div>
        <div ref={scrollRef} className="col-span-6 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex items-start text-center flex-nowrap">
            {items.map((item, index) => (
              <button key={index} onClick={() => onItemClick(item.slug)} className="flex flex-col items-center text-xs min-w-[33.333%] flex-shrink-0 px-1 text-gray-600 hover:text-[#203b8a] transition-colors">
                <i className={`${item.icon} text-xl mb-1 w-6 text-center leading-none`}></i>
                <span className="h-10 flex items-center text-center leading-tight">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-1 flex justify-center">
          <button onClick={() => handleScroll('right')} disabled={!scrollState.canScrollRight} className="group z-10 w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm shadow-md disabled:opacity-30 flex items-center justify-center transition hover:bg-[#203b8a]">
            <i className="fas fa-chevron-right text-lg text-[#203b8a] group-hover:text-white transition-colors"></i>
          </button>
        </div>
      </div>
    </div>
  );
}