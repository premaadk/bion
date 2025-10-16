import React from 'react';

type Notification = {
    avatar: string;
    iconClass: string;
    iconBg: string;
    text: string;
    time: string;
    isRead: boolean;
};

interface NotificationsDropdownProps {
    isActive: boolean;
    onToggle: () => void;
    notifications: Notification[];
    searchTerm: string;
    onSearch: (term: string) => void;
    loadedCount: number;
    onLoadMore: () => void;
}

export function NotificationsDropdown({
    isActive,
    onToggle,
    notifications,
    searchTerm,
    onSearch,
    loadedCount,
    onLoadMore,
}: NotificationsDropdownProps) {
    const filteredNotifications = notifications.filter(notif => {
        const textWithoutHTML = notif.text.replace(/<[^>]*>/g, '');
        return textWithoutHTML.toLowerCase().includes(searchTerm.toLowerCase());
    });
    const displayedNotifications = filteredNotifications.slice(0, loadedCount);
    const hasMoreNotifications = filteredNotifications.length > loadedCount;

    return (
        <div className="relative" data-dropdown-container="notifications">
            <button
                onClick={onToggle}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#d3e2fd] text-[#203b8a]' : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
                <i className="fas fa-bell text-sm lg:text-lg"></i>
            </button>

            {isActive && (
                <div className="hidden md:block absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60]">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold">Notifications</h3>
                            <button className="text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                                <i className="fas fa-ellipsis-h text-sm"></i>
                            </button>
                        </div>
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search Notifications"
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#203b8a] text-sm"
                                value={searchTerm}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col h-96">
                        <div className="flex-1 overflow-y-auto px-1">
                            {displayedNotifications.length > 0 ? (
                                displayedNotifications.map((notif, index) => (
                                    <a key={index} href="#" className="flex items-start p-2 hover:bg-gray-100 rounded-lg">
                                        <div className="relative flex-shrink-0 mr-3">
                                            <img className="h-12 w-12 rounded-full object-cover" src={notif.avatar} alt="Avatar" />
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${notif.iconBg} rounded-full flex items-center justify-center`}>
                                                <i className={`${notif.iconClass} text-xs text-white`}></i>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 leading-snug mb-1" dangerouslySetInnerHTML={{ __html: notif.text }}></p>
                                            <p className={`text-xs ${!notif.isRead ? 'font-bold text-[#203b8a]' : 'text-gray-500'}`}>
                                                {notif.time}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-3 h-3 bg-[#203b8a] rounded-full flex-shrink-0 ml-2 mt-1"></div>
                                        )}
                                    </a>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm">No notifications found</p>
                                </div>
                            )}
                        </div>
                        {filteredNotifications.length > 0 && (
                            <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white rounded-b-lg">
                                <button
                                    onClick={onLoadMore}
                                    disabled={!hasMoreNotifications}
                                    className={`w-full text-center text-sm py-2 rounded-lg font-semibold transition-colors ${
                                        hasMoreNotifications
                                            ? 'text-[#203b8a] hover:bg-gray-100 cursor-pointer'
                                            : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {hasMoreNotifications ? 'View More Notifications' : 'All notifications loaded'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}