import { App } from '../header-types';
import { ModalContainer, ModalHeader, SearchInput } from '../shared-components';
import { groupAppsByCategory } from '../header-utils';

interface AppsModalProps {
  apps: App[];
  searchTerm: string;
  onSearch: (term: string) => void;
  onClose: () => void;
  onAppClick: (appName: string) => void;
}

export function AppsModal({ apps, searchTerm, onSearch, onClose, onAppClick }: AppsModalProps) {
  const groupedApps = groupAppsByCategory(apps);

  return (
    <ModalContainer>
      <ModalHeader title="Apps" onBack={onClose} />
      <div className="p-4 border-b border-gray-100 bg-white sticky top-[65px] z-10">
        <SearchInput placeholder="Search in Apps" value={searchTerm} onChange={onSearch} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedApps).length > 0 ? Object.entries(groupedApps).map(([category, categoryApps]) => (
          <div key={category} className="mb-6">
            <h3 className="px-3 text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">{category}</h3>
            <div className="space-y-1">
              {categoryApps.map((app, index) => (
                <button key={index} onClick={() => onAppClick(app.name)} className="flex items-center p-3 hover:bg-gray-100 rounded-lg w-full text-left transition-colors">
                  <i className={`${app.icon} w-8 text-center text-xl text-[#203b8a]`}></i>
                  <span className="ml-4 font-semibold text-gray-800">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        )) : (
          <div className="flex items-center justify-center h-40 text-center">
            <p className="text-gray-500">No applications found.</p>
          </div>
        )}
      </div>
    </ModalContainer>
  );
}