import { useMemo } from 'react';
import { MobileModalsProps } from '../header-types';
import { getAllFilteredData } from '../header-utils';
import { AppsModal } from '@/components/header/mobile/apps-modal';
import { FriendRequestsModal } from '@/components/header/mobile/friend-requests-modal';
import { ChatModal } from '@/components/header/mobile/chat-modal';
import { NotificationsModal } from '@/components/header/mobile/notifications-modal';
import { ProfileModal } from '@/components/header/mobile/profile-modal';

export function MobileModals({
  activeDropdown,
  closeAllDropdowns,
  friendRequestsData,
  chatsData,
  notificationsData,
  appsData,
  searchTerms,
  loadedCounts,
  user,
  onSearch,
  onLoadMore,
  onAppsNavigation,
  onChatClick,
  onProfileNavigation,
  onLogout,
  onSearchFriends,
}: MobileModalsProps) {
  // Memoized filtered data
  const filteredData = useMemo(() =>
    getAllFilteredData(
      { friendRequestsData, chatsData, notificationsData, appsData },
      searchTerms
    ),
    [friendRequestsData, chatsData, notificationsData, appsData, searchTerms]
  );

  if (!activeDropdown) return null;

  const modalMap: Record<string, React.ReactNode> = {
    'apps': <AppsModal apps={filteredData.apps} searchTerm={searchTerms.apps} onSearch={(term) => onSearch('apps', term)} onClose={closeAllDropdowns} onAppClick={onAppsNavigation} />,
    'friendRequests': <FriendRequestsModal friendRequests={filteredData.friendRequests} searchTerm={searchTerms.friendRequests} loadedCount={loadedCounts.friendRequests} onSearch={(term) => onSearch('friendRequests', term)} onClose={closeAllDropdowns} onLoadMore={(e) => onLoadMore('friendRequests', e)} onSearchFriends={onSearchFriends} />,
    'messenger': <ChatModal chats={filteredData.chats} searchTerm={searchTerms.chats} loadedCount={loadedCounts.chats} onSearch={(term) => onSearch('chats', term)} onClose={closeAllDropdowns} onLoadMore={(e) => onLoadMore('chats', e)} onChatClick={onChatClick} />,
    'notifications': <NotificationsModal notifications={filteredData.notifications} searchTerm={searchTerms.notifications} loadedCount={loadedCounts.notifications} onSearch={(term) => onSearch('notifications', term)} onClose={closeAllDropdowns} onLoadMore={(e) => onLoadMore('notifications', e)} />,
    'profile': <ProfileModal user={user} onClose={closeAllDropdowns} onProfileNavigation={onProfileNavigation} onLogout={onLogout} />,
  };

  return (
    <div className="md:hidden">
      {modalMap[activeDropdown] || null}
    </div>
  );
}