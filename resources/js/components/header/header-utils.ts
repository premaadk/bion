import { FriendRequest, Chat, Notification, App, SearchTerms } from './header-types';

/**
 * Filter data berdasarkan search terms
 */
export function filterData<T>(
  data: T[],
  searchTerm: string,
  searchFn: (item: T, term: string) => boolean
): T[] {
  if (!searchTerm.trim()) return data;
  return data.filter(item => searchFn(item, searchTerm.toLowerCase()));
}

export function filterFriendRequests(requests: FriendRequest[], searchTerm: string): FriendRequest[] {
  return filterData(requests, searchTerm, (request, term) => request.name.toLowerCase().includes(term));
}

export function filterChats(chats: Chat[], searchTerm: string): Chat[] {
  return filterData(chats, searchTerm, (chat, term) => chat.name.toLowerCase().includes(term));
}

export function filterNotifications(notifications: Notification[], searchTerm: string): Notification[] {
  return filterData(notifications, searchTerm, (notif, term) => {
    const textWithoutHTML = notif.text.replace(/<[^>]*>/g, '');
    return textWithoutHTML.toLowerCase().includes(term);
  });
}

export function filterApps(apps: App[], searchTerm: string): App[] {
  return filterData(apps, searchTerm, (app, term) => app.name.toLowerCase().includes(term));
}

/**
 * Mendapatkan semua data yang sudah difilter
 */
export function getAllFilteredData(
  data: {
    friendRequestsData: FriendRequest[];
    chatsData: Chat[];
    notificationsData: Notification[];
    appsData: App[];
  },
  searchTerms: SearchTerms
) {
  return {
    friendRequests: filterFriendRequests(data.friendRequestsData, searchTerms.friendRequests),
    chats: filterChats(data.chatsData, searchTerms.chats),
    notifications: filterNotifications(data.notificationsData, searchTerms.notifications),
    apps: filterApps(data.appsData, searchTerms.apps),
  };
}

/**
 * Mengelompokkan aplikasi berdasarkan kategori
 */
export function groupAppsByCategory(apps: App[]): Record<string, App[]> {
  const categories = ['All Role', 'Author', 'Editor Rubrik', 'Admin Rubrik', 'Super Admin'];
  const grouped: Record<string, App[]> = {};
  categories.forEach(category => {
    const categoryApps = apps.filter(app => app.category === category);
    if (categoryApps.length > 0) {
      grouped[category] = categoryApps;
    }
  });
  return grouped;
}

/**
 * === FUNGSI YANG HILANG DITAMBAHKAN DI SINI ===
 * Menghapus tag HTML dari teks
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}