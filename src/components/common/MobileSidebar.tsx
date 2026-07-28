import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform, ActiveTab } from '../../context/PlatformContext';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Search, 
  Bookmark, 
  MessageSquare, 
  CalendarCheck, 
  Bell, 
  User as UserIcon, 
  Settings, 
  Building2, 
  PlusSquare, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles,
  Phone,
  Compass,
  X,
  Download
} from 'lucide-react';

export const MobileSidebar: React.FC = () => {
  const { user } = useAuth();
  const { 
    isSidebarOpen, 
    setIsSidebarOpen, 
    activeTab, 
    setActiveTab, 
    unreadNotificationCount, 
    setIsPhoneVerifyModalOpen,
    setIsAppDownloadModalOpen
  } = usePlatform();

  const isLandlord = user?.role === 'landlord';
  const isAdmin = user?.role === 'admin';

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    highlight?: boolean;
  }

  const tenantNavItems: NavItem[] = [
    { id: 'home', label: 'Explore Homes', icon: Home },
    { id: 'search', label: 'Search Houses', icon: Search },
    { id: 'navigation', label: 'Live Navigation', icon: Compass, highlight: true },
    { id: 'saved', label: 'Saved Houses', icon: Bookmark },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationCount },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const landlordNavItems: NavItem[] = [
    { id: 'my_houses', label: 'My Properties', icon: Building2 },
    { id: 'add_house', label: 'Add New House', icon: PlusSquare, highlight: true },
    { id: 'bookings', label: 'Booking Requests', icon: CalendarCheck },
    { id: 'messages', label: 'Tenant Chat', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationCount },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'admin', label: 'Admin Console', icon: ShieldCheck },
    { id: 'home', label: 'Public House View', icon: Home },
    { id: 'messages', label: 'System Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeNavList = isLandlord ? landlordNavItems : (isAdmin ? adminNavItems : tenantNavItems);

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    setIsSidebarOpen(false); // Close mobile sidebar after selecting an item
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[9995]">
          {/* Backdrop Overlay - Tapping outside closes sidebar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Slide-out Mobile Sidebar Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="absolute top-0 left-0 bottom-0 w-72 bg-white p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-[9996] border-r border-[#E8D8B9]/80"
          >
            <div className="space-y-6">
              {/* Header with Logo and Close button */}
              <div className="flex items-center justify-between">
                <Logo size="md" />
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-[#146C5A] hover:bg-gray-200 transition-colors"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Landlord Unverified Phone Notice */}
              {isLandlord && !user.isPhoneVerified && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-[#B66A32]" />
                    Phone Unverified
                  </div>
                  <p className="text-[11px] text-amber-700 leading-snug">
                    Verify phone number to enable property publishing.
                  </p>
                  <button
                    onClick={() => {
                      setIsPhoneVerifyModalOpen(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-1.5 px-2 bg-[#B66A32] text-white font-bold text-[11px] rounded-xl shadow-xs hover:bg-[#a05b2a] flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3 h-3" /> Verify Phone Now
                  </button>
                </div>
              )}

              {/* Navigation List */}
              <nav className="space-y-1.5">
                {activeNavList.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#146C5A] text-white shadow-md shadow-[#146C5A]/20'
                          : item.highlight
                          ? 'bg-[#E8D8B9]/40 text-[#146C5A] hover:bg-[#E8D8B9]/80 border border-[#B66A32]/20'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#146C5A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#E8D8B9]' : (item.highlight ? 'text-[#B66A32]' : 'text-gray-500')}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && item.badge > 0 ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-[#E8D8B9] text-[#146C5A]' : 'bg-[#C13F4A] text-white'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer Guarantee & App Download */}
            <div className="space-y-3 mt-6">
              <button
                onClick={() => {
                  setIsAppDownloadModalOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#E8D8B9]" />
                Install Mobile App
              </button>

              <div className="p-3.5 bg-[#F8F9FA] border border-gray-200/80 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#146C5A] font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 text-[#B66A32]" />
                  CasaLink Guarantee
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Direct landlord connections. Zero commission, zero booking fees.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
