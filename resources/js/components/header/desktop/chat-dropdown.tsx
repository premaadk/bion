import React from 'react';

type Chat = {
    name: string;
    avatar: string;
    message: string;
    time: string;
    isRead: boolean;
    isOnline: boolean;
};

interface ChatDropdownProps {
    isActive: boolean;
    onToggle: () => void;
    chats: Chat[];
    searchTerm: string;
    onSearch: (term: string) => void;
    loadedCount: number;
    onLoadMore: () => void;
    onChatClick: (chat: Chat) => void;
    onExpandClick: () => void;
}

export function ChatDropdown({
    isActive,
    onToggle,
    chats,
    searchTerm,
    onSearch,
    loadedCount,
    onLoadMore,
    onChatClick,
    onExpandClick,
}: ChatDropdownProps) {
    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const displayedChats = filteredChats.slice(0, loadedCount);
    const hasMoreChats = filteredChats.length > loadedCount;

    return (
        <div className="relative" data-dropdown-container="messenger">
            <button
                onClick={onToggle}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#d3e2fd] text-[#203b8a]' : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
                <i className="fas fa-comments text-sm lg:text-lg"></i>
            </button>

            {isActive && (
                <div className="hidden md:block absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60]">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold">Chats</h3>
                            <div className="flex space-x-1">
                                <button
                                    onClick={onExpandClick}
                                    className="text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
                                    title="Open chats page"
                                >
                                    <i className="fas fa-expand text-sm"></i>
                                </button>
                                <button className="text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                                    <i className="fas fa-ellipsis-h text-sm"></i>
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search in Chats"
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#203b8a] text-sm"
                                value={searchTerm}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col h-96">
                        <div className="flex-1 overflow-y-auto px-1">
                            {displayedChats.length > 0 ? (
                                displayedChats.map((chat, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onChatClick(chat)}
                                        className="w-full flex items-center p-2 hover:bg-gray-100 rounded-lg text-left"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img className="h-14 w-14 rounded-full object-cover" src={chat.avatar} alt="Avatar" />
                                            {chat.isOnline && (
                                                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
                                            )}
                                        </div>
                                        <div className="ml-3 flex-1 overflow-hidden">
                                            <p className="text-sm font-semibold">{chat.name}</p>
                                            <p className={`text-xs truncate ${chat.isRead ? 'text-gray-500' : 'text-gray-900 font-bold'}`}>
                                                {chat.message} • {chat.time}
                                            </p>
                                        </div>
                                        {!chat.isRead && (
                                            <div className="w-3 h-3 bg-[#203b8a] rounded-full flex-shrink-0 ml-2"></div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm">No chats found</p>
                                </div>
                            )}
                        </div>
                        {filteredChats.length > 0 && (
                             <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white rounded-b-lg">
                                <button
                                    onClick={onLoadMore}
                                    disabled={!hasMoreChats}
                                    className={`w-full text-center text-sm py-2 rounded-lg font-semibold transition-colors ${
                                        hasMoreChats
                                            ? 'text-[#203b8a] hover:bg-gray-100 cursor-pointer'
                                            : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {hasMoreChats ? 'View More Chats' : 'All chats loaded'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}