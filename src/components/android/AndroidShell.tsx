import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { 
  Home, 
  Search, 
  Bookmark, 
  CalendarCheck, 
  MessageSquare, 
  Bell, 
  Building2, 
  Wifi, 
  Battery, 
  Signal,
  X,
  Compass
} from 'lucide-react';

export const AndroidShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deviceView, setDeviceView, activeTab, setActiveTab, unreadNotifCount } = usePlatform();
  const { user } = useAuth();

  if (deviceView !== 'android') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6 px-2 flex flex-col items-center justify-center">
      
      {/* Top Banner indicating Android App Simulator */}
      <div className="mb-4 text-center text-white space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-[#E8D8B9]">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" /> CasaLink Android Application View
        </div>
        <p className="text-xs text-gray-400">
          Showing real-time Android smartphone interface.
          <button
            onClick={() => setDeviceView('web')}
            className="ml-2 text-[#E8D8B9] underline font-bold"
          >
            Switch to Full Web View
          </button>
        </p>
      </div>

      {/* Smartphone Body Container */}
      <div className="relative w-full max-w-[420px] h-[850px] bg-black rounded-[48px] shadow-2xl border-[10px] border-gray-800 ring-1 ring-white/10 overflow-hidden flex flex-col">
        
        {/* Android Top Notch Camera Bar */}
        <div className="relative bg-black px-6 pt-3 pb-2 flex items-center justify-between text-white text-[11px] font-bold z-50 shrink-0">
          <span>09:41</span>
          
          {/* Camera cutout */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-20 h-4 bg-black rounded-full flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 ring-1 ring-gray-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
          </div>

          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Android App Top Header */}
        <div className="bg-[#146C5A] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-40">
          <Logo size="sm" isDarkBg={true} />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-1.5 rounded-xl bg-white/10 text-white"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C13F4A] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Android App Content */}
        <div className="flex-1 bg-[#FDFBF7] overflow-y-auto p-4 scrollbar-thin">
          {children}
        </div>

        {/* Android Bottom Navigation Bar */}
        <div className="bg-white border-t border-gray-200 px-2 py-2 flex items-center justify-around shrink-0 z-40">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              activeTab === 'home' ? 'text-[#146C5A]' : 'text-gray-400'
            }`}
          >
            <Home className="w-5 h-5" /> Home
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              activeTab === 'search' ? 'text-[#146C5A]' : 'text-gray-400'
            }`}
          >
            <Search className="w-5 h-5" /> Search
          </button>

          {user?.role !== 'landlord' && (
            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                activeTab === 'navigation' ? 'text-[#146C5A]' : 'text-gray-400'
              }`}
            >
              <Compass className="w-5 h-5" /> Navigate
            </button>
          )}

          {user?.role === 'landlord' ? (
            <button
              onClick={() => setActiveTab('my_houses')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                ['my_houses', 'add_house'].includes(activeTab) ? 'text-[#146C5A]' : 'text-gray-400'
              }`}
            >
              <Building2 className="w-5 h-5" /> Properties
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
                activeTab === 'saved' ? 'text-[#146C5A]' : 'text-gray-400'
              }`}
            >
              <Bookmark className="w-5 h-5" /> Saved
            </button>
          )}

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              activeTab === 'bookings' ? 'text-[#146C5A]' : 'text-gray-400'
            }`}
          >
            <CalendarCheck className="w-5 h-5" /> Bookings
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
              activeTab === 'messages' ? 'text-[#146C5A]' : 'text-gray-400'
            }`}
          >
            <MessageSquare className="w-5 h-5" /> Chat
          </button>
        </div>

        {/* Android Gesture Bar */}
        <div className="bg-white py-1 flex items-center justify-center shrink-0">
          <div className="w-28 h-1 bg-gray-300 rounded-full" />
        </div>

      </div>
    </div>
  );
};
