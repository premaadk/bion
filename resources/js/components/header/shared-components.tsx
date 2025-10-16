import { ModalHeaderProps, SearchInputProps, LoadMoreButtonProps } from './header-types';

export function ModalHeader({ title, onBack }: ModalHeaderProps) {
  return (
    <div className="flex items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
      <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
        <i className="fas fa-arrow-left text-xl"></i>
      </button>
      <h1 className="text-xl font-bold flex-1 text-center mr-8 text-gray-800">{title}</h1>
    </div>
  );
}

export function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#203b8a]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function LoadMoreButton({ isDisabled, onClick, allLoadedText, loadMoreText }: LoadMoreButtonProps) {
  return (
    <div className="bg-white border-t border-gray-100 p-4 sticky bottom-0">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full text-center font-bold py-3 transition-colors rounded-lg ${
          isDisabled
            ? 'text-gray-400 cursor-not-allowed bg-gray-100'
            : 'text-white bg-[#203b8a] hover:bg-[#182c69]'
        }`}
      >
        {isDisabled ? allLoadedText : loadMoreText}
      </button>
    </div>
  );
}

export function ModalContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-white z-[50] flex flex-col" data-mobile-modal="true">
      {children}
    </div>
  );
}