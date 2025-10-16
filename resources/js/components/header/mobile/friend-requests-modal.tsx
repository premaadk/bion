import { FriendRequest } from '../header-types';
import { ModalContainer, ModalHeader, SearchInput, LoadMoreButton } from '../shared-components';

interface FriendRequestsModalProps {
  friendRequests: FriendRequest[];
  searchTerm: string;
  loadedCount: number;
  onSearch: (term: string) => void;
  onClose: () => void;
  onLoadMore: (e: React.MouseEvent) => void;
  onSearchFriends?: () => void;
}

export function FriendRequestsModal({ friendRequests, searchTerm, loadedCount, onSearch, onClose, onLoadMore, onSearchFriends }: FriendRequestsModalProps) {
  const displayedRequests = friendRequests.slice(0, loadedCount);

  return (
    <ModalContainer>
      <ModalHeader title="Friend Requests" onBack={onClose} />
      <div className="p-4 border-b border-gray-100 bg-white sticky top-[65px] z-10">
        <div className="mb-3">
          <SearchInput placeholder="Search Requests" value={searchTerm} onChange={onSearch} />
        </div>
        <button onClick={onSearchFriends} className="w-full px-4 py-3 bg-[#203b8a] text-white rounded-lg hover:bg-[#182c69] transition-colors font-semibold flex items-center justify-center gap-2">
          <i className="fas fa-user-friends"></i>Search for Friends
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayedRequests.length > 0 ? displayedRequests.map((request, index) => (
          <div key={request.id || index} className="p-4 border-b border-gray-100">
            <div className="flex items-start space-x-4">
              <img className="h-16 w-16 rounded-full object-cover flex-shrink-0" src={request.avatar} alt={request.name} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{request.name}</h3>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{request.time}</span>
                </div>
                {request.mutual > 0 && <p className="text-sm text-gray-500 mb-3">{request.mutual} mutual friends</p>}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-[#203b8a] hover:bg-[#182c69] text-white font-bold py-2 px-4 rounded-lg transition-colors">Confirm</button>
                  <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="flex items-center justify-center h-40 text-center">
            <p className="text-gray-500">No friend requests found.</p>
          </div>
        )}
      </div>
      <LoadMoreButton isDisabled={friendRequests.length <= loadedCount} onClick={onLoadMore} allLoadedText="All requests have been displayed" loadMoreText="View more requests" />
    </ModalContainer>
  );
}