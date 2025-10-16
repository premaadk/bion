import { ModalContainer, ModalHeader } from '../shared-components';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfileModalProps {
  onClose: () => void;
  onProfileNavigation?: (page: string) => void;
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}

const getInitials = (name: string = ''): string => {
    const names = name.trim().split(' ');
    if (names.length === 0 || names[0] === '') return '?';
    const firstInitial = names[0][0];
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
};

export function ProfileModal({ onClose, onProfileNavigation, onLogout, user }: ProfileModalProps) {
  const userData = user || {
    name: 'User',
    email: 'email@example.com',
    avatar: null
  };

  const menuItems = [
    { page: 'profil', title: 'My Profile', subtitle: 'Manage your personal information', icon: 'fa-user', color: 'blue' },
    { page: 'artikelku', title: 'My Articles', subtitle: 'Manage the articles you have written', icon: 'fa-newspaper', color: 'green' },
    { page: 'settings', title: 'Settings', subtitle: 'Adjust your app preferences', icon: 'fa-cog', color: 'gray' },
    { page: 'help', title: 'Help', subtitle: 'Get help and support', icon: 'fa-question-circle', color: 'yellow' },
    { page: 'privacy', title: 'Privacy', subtitle: 'Manage your privacy settings', icon: 'fa-shield-alt', color: 'purple' },
  ];

  return (
    <ModalContainer>
      <ModalHeader title="Profile" onBack={onClose} />
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20 text-2xl">
            {userData.avatar && <AvatarImage src={userData.avatar} alt={userData.name} />}
            <AvatarFallback className="bg-gray-200 text-gray-700 font-bold">
              {getInitials(userData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{userData.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{userData.email}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {menuItems.map(item => (
            <button key={item.page} onClick={() => onProfileNavigation?.(item.page)} className="w-full flex items-center px-6 py-4 text-left hover:bg-gray-50 border-b border-gray-50 transition-colors">
              <div className={`w-10 h-10 bg-${item.color}-100 rounded-full flex items-center justify-center mr-4`}>
                <i className={`fas ${item.icon} text-${item.color}-600`}></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.subtitle}</p>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border-t border-gray-100 p-6">
        <button onClick={onLogout} className="w-full flex items-center justify-center px-6 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
          <i className="fas fa-sign-out-alt text-red-600 mr-3"></i>
          <span className="font-semibold text-red-600">Logout</span>
        </button>
      </div>
    </ModalContainer>
  );
}