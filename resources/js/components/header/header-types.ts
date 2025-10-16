export interface FriendRequest {
  id?: number;
  name: string;
  avatar: string;
  time: string;
  mutual: number;
  user_id?: number;
}

export interface Chat {
  id?: number;
  name: string;
  avatar: string;
  message: string;
  time: string;
  isRead: boolean;
  isOnline: boolean;
  user_id?: number;
}

export interface Notification {
  id?: number;
  avatar: string;
  iconClass: string;
  iconBg: string;
  text: string;
  time: string;
  isRead: boolean;
  type?: string;
}

export interface App {
  id?: number;
  category: string;
  name: string;
  icon: string;
  route?: string;
  permission?: string;
}

export interface SearchTerms {
  friendRequests: string;
  chats: string;
  notifications: string;
  apps: string;
}

export interface LoadedCounts {
  friendRequests: number;
  chats: number;
  notifications: number;
  apps: number;
}

export interface MobileModalsProps {
  activeDropdown: string | null;
  closeAllDropdowns: () => void;
  friendRequestsData: FriendRequest[];
  chatsData: Chat[];
  notificationsData: Notification[];
  appsData: App[];
  searchTerms: SearchTerms;
  loadedCounts: LoadedCounts;
  user?: { name: string; email: string; avatar: string; };
  onSearch: (type: keyof SearchTerms, term: string) => void;
  onLoadMore: (type: keyof LoadedCounts, event?: React.MouseEvent) => void;
  onAppsNavigation: (appName: string) => void;
  onChatClick: (chat: Chat) => void;
  onProfileNavigation?: (page: string) => void;
  onLogout?: () => void;
  onSearchFriends?: () => void;
}

export interface ModalHeaderProps {
  title: string;
  onBack: () => void;
}

export interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export interface LoadMoreButtonProps {
  isDisabled: boolean;
  onClick: (e: React.MouseEvent) => void;
  allLoadedText: string;
  loadMoreText: string;
}