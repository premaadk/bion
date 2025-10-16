import { Chat } from '../header-types';
import { ModalContainer, ModalHeader, SearchInput, LoadMoreButton } from '../shared-components';

interface ChatModalProps {
  chats: Chat[];
  searchTerm: string;
  loadedCount: number;
  onSearch: (term: string) => void;
  onClose: () => void;
  onLoadMore: (e: React.MouseEvent) => void;
  onChatClick: (chat: Chat) => void;
}

export function ChatModal({ chats, searchTerm, loadedCount, onSearch, onClose, onLoadMore, onChatClick }: ChatModalProps) {
  const displayedChats = chats.slice(0, loadedCount);

  return (
    <ModalContainer>
      <ModalHeader title="Chats" onBack={onClose} />
      <div className="p-4 border-b border-gray-100 bg-white sticky top-[65px] z-10">
        <SearchInput placeholder="Search in Chats" value={searchTerm} onChange={onSearch} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayedChats.length > 0 ? displayedChats.map((chat, index) => (
          <button key={chat.id || index} onClick={() => onChatClick(chat)} className="flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 w-full text-left transition-colors">
            <div className="relative flex-shrink-0 mr-4">
              <img className="h-14 w-14 rounded-full object-cover" src={chat.avatar} alt={chat.name} />
              {chat.isOnline && <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{chat.name}</h3>
              <p className={`text-sm truncate ${chat.isRead ? 'text-gray-500' : 'text-gray-900 font-bold'}`}>{chat.message} • {chat.time}</p>
            </div>
            {!chat.isRead && <div className="w-3 h-3 bg-[#203b8a] rounded-full ml-2 self-center"></div>}
          </button>
        )) : (
          <div className="flex items-center justify-center h-40 text-center">
            <p className="text-gray-500">No chats found.</p>
          </div>
        )}
      </div>
      <LoadMoreButton isDisabled={chats.length <= loadedCount} onClick={onLoadMore} allLoadedText="All chats have been displayed" loadMoreText="View more chats" />
    </ModalContainer>
  );
}