import React from 'react';

type FriendRequest = {
    name: string;
    avatar: string;
    time: string;
    mutual: number;
};

interface FriendRequestsDropdownProps {
    isActive: boolean;
    onToggle: () => void;
    friendRequests: FriendRequest[];
    searchTerm: string;
    onSearch: (term: string) => void;
    loadedCount: number;
    onLoadMore: () => void;
    onSearchFriends: () => void;
}

export function FriendRequestsDropdown({
    isActive,
    onToggle,
    friendRequests,
    searchTerm,
    onSearch,
    loadedCount,
    onLoadMore,
    onSearchFriends
}: FriendRequestsDropdownProps) {
    const filteredFriendRequests = friendRequests.filter(request =>
        request.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const displayedFriendRequests = filteredFriendRequests.slice(0, loadedCount);
    const hasMoreFriendRequests = filteredFriendRequests.length > loadedCount;

    return (
        <div className="relative" data-dropdown-container="friendRequests">
            <button
                onClick={onToggle}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                    isActive ? 'bg-[#d3e2fd] text-[#203b8a]' : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
                <i className="fas fa-user-plus text-sm lg:text-lg"></i>
            </button>

            {isActive && (
                <div className="hidden md:block absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60]">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold">Friend Requests</h3>
                            <button className="text-gray-500 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                                <i className="fas fa-ellipsis-h text-sm"></i>
                            </button>
                        </div>
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search Requests"
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#203b8a] text-sm"
                                value={searchTerm}
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={onSearchFriends}
                            className="w-full mt-3 px-4 py-2.5 bg-[#203b8a] text-white rounded-lg hover:bg-[#182c69] transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-user-friends"></i>
                            Search for Friends
                        </button>
                    </div>
                    <div className="flex flex-col h-96">
                        <div className="flex-1 overflow-y-auto px-1">
                            {displayedFriendRequests.length > 0 ? (
                                displayedFriendRequests.map((request, index) => (
                                    <div key={index} className="p-3 hover:bg-gray-100 rounded-lg">
                                        <div className="flex items-start">
                                            <img className="h-14 w-14 rounded-full object-cover flex-shrink-0" src={request.avatar} alt="Avatar" />
                                            <div className="ml-3 flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-bold">{request.name}</p>
                                                    <p className="text-xs text-gray-500">{request.time}</p>
                                                </div>
                                                {request.mutual > 0 && (
                                                    <div className="flex items-center mt-1">
                                                        <span className="text-xs text-gray-500">{request.mutual} mutual friends</span>
                                                    </div>
                                                )}
                                                <div className="mt-2 flex space-x-2">
                                                    <button className="flex-1 bg-[#203b8a] hover:bg-[#182c69] text-white font-semibold py-2 px-3 rounded-lg text-sm">
                                                        Confirm
                                                    </button>
                                                    <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-semibold py-2 px-3 rounded-lg text-sm">
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm">No friend requests found</p>
                                </div>
                            )}
                        </div>
                        {filteredFriendRequests.length > 0 && (
                            <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white rounded-b-lg">
                                <button
                                    onClick={onLoadMore}
                                    disabled={!hasMoreFriendRequests}
                                    className={`w-full text-center text-sm py-2 rounded-lg font-semibold transition-colors ${
                                        hasMoreFriendRequests
                                            ? 'text-[#203b8a] hover:bg-gray-100 cursor-pointer'
                                            : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {hasMoreFriendRequests ? 'View More Requests' : 'All requests loaded'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}