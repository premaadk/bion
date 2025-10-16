import { Notification } from '../header-types';
import { ModalContainer, ModalHeader, SearchInput, LoadMoreButton } from '../shared-components';
import { stripHtmlTags } from '../header-utils';

interface NotificationsModalProps {
  notifications: Notification[];
  searchTerm: string;
  loadedCount: number;
  onSearch: (term: string) => void;
  onClose: () => void;
  onLoadMore: (e: React.MouseEvent) => void;
}

export function NotificationsModal({ notifications, searchTerm, loadedCount, onSearch, onClose, onLoadMore }: NotificationsModalProps) {
  const displayedNotifications = notifications.slice(0, loadedCount);

  return (
    <ModalContainer>
      <ModalHeader title="Notifications" onBack={onClose} />
      <div className="p-4 border-b border-gray-100 bg-white sticky top-[65px] z-10">
        <SearchInput placeholder="Search Notifications" value={searchTerm} onChange={onSearch} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayedNotifications.length > 0 ? displayedNotifications.map((notif, index) => (
          <a key={notif.id || index} href="#" className="flex items-start p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors">
            <div className="relative flex-shrink-0 mr-4">
              <img className="h-14 w-14 rounded-full object-cover" src={notif.avatar} alt={stripHtmlTags(notif.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug mb-1" dangerouslySetInnerHTML={{ __html: notif.text }}></p>
              <p className={`text-xs ${!notif.isRead ? 'font-bold text-[#203b8a]' : 'text-gray-500'}`}>{notif.time}</p>
            </div>
            {!notif.isRead && <div className="w-3 h-3 bg-[#203b8a] rounded-full ml-2 self-center flex-shrink-0"></div>}
          </a>
        )) : (
           <div className="flex items-center justify-center h-40 text-center">
            <p className="text-gray-500">No new notifications.</p>
          </div>
        )}
      </div>
      <LoadMoreButton isDisabled={notifications.length <= loadedCount} onClick={onLoadMore} allLoadedText="All notifications have been displayed" loadMoreText="View more notifications" />
    </ModalContainer>
  );
}