import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { Logo } from './Logo';
import { 
  Smartphone, 
  Monitor, 
  Menu, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  ChevronDown,
  Sparkles,
  HelpCircle,
  X,
  Download
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchRoleQuick } = useAuth();
  const { 
    viewMode, 
    setViewMode, 
    toggleSidebar, 
    activeTab, 
    setActiveTab, 
    unreadNotificationCount, 
    openAuthModal,
    searchFilters,
    setSearchFilters,
    setIsAppDownloadModalOpen
  } = usePlatform();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('search');
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E8D8B9]/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-[#242424] hover:text-[#146C5A] hover:bg-[#E8D8B9]/40 transition-colors focus:outline-none"
            title="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button onClick={() => setActiveTab(user?.role === 'landlord' ? 'my_houses' : (user?.role === 'admin' ? 'admin' : 'home'))} className="text-left">
            <Logo size="md" />
          </button>
        </div>

        {/* Middle: Platform View Switcher (📱 Android Application vs 💻 Website View) */}
        <div className="hidden md:flex items-center bg-[#E8D8B9]/30 p-1 rounded-2xl border border-[#E8D8B9] shadow-inner">
          <button
            onClick={() => setViewMode('web')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'web'
                ? 'bg-[#146C5A] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#146C5A]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Responsive Website
          </button>

          <button
            onClick={() => setViewMode('android')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'android'
                ? 'bg-[#146C5A] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#146C5A]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#E8D8B9]" />
            Android App View
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Demo Role Picker Pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#E8D8B9]/30 px-3 py-1 rounded-xl border border-[#B66A32]/20">
            <span className="text-[11px] font-bold text-[#B66A32]">Demo Role:</span>
            <div className="flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => switchRoleQuick('tenant')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  user?.role === 'tenant' ? 'bg-[#146C5A] text-white font-bold' : 'text-gray-700 hover:bg-white/60'
                }`}
              >
                Tenant
              </button>
              <button
                onClick={() => switchRoleQuick('landlord')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  user?.role === 'landlord' ? 'bg-[#146C5A] text-white font-bold' : 'text-gray-700 hover:bg-white/60'
                }`}
              >
                Landlord
              </button>
              <button
                onClick={() => switchRoleQuick('admin')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  user?.role === 'admin' ? 'bg-[#146C5A] text-white font-bold' : 'text-gray-700 hover:bg-white/60'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* App Download Prompt Button */}
          <button
            onClick={() => setIsAppDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#146C5A] hover:bg-[#0E5244] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Download CasaLink Mobile App"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#E8D8B9]" />
            <span className="hidden sm:inline">Get Mobile App</span>
          </button>

          {/* Live Android App View Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'android' ? 'web' : 'android')}
            className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'android' ? 'bg-[#146C5A] text-white' : 'bg-amber-100/80 hover:bg-amber-200/80 text-[#146C5A] border border-[#E8D8B9]'
            }`}
            title={viewMode === 'android' ? 'Switch to Desktop Web View' : 'Switch to Live Android Smartphone View'}
          >
            {viewMode === 'android' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-[#B66A32]" />}
            <span className="hidden md:inline">{viewMode === 'android' ? 'Web View' : 'Android Mode'}</span>
          </button>

          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-[#146C5A] transition-colors"
            title="Search houses"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-[#146C5A] transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C13F4A] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Landlord Add House CTA */}
          {user?.role === 'landlord' && (
            <button
              onClick={() => setActiveTab('add_house')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#E8D8B9]" />
              Add House
            </button>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-lg object-cover border border-[#146C5A]/30"
                />
                <span className="hidden sm:block text-xs font-bold text-[#242424] max-w-[100px] truncate">
                  {user.fullName.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-[#F8F9FA]">
                    <p className="text-xs font-bold text-[#242424] truncate">{user.fullName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#146C5A]/10 text-[#146C5A]">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => { setActiveTab('profile'); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-gray-400" /> My Profile
                  </button>

                  <button
                    onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" /> Settings & Help
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#C13F4A] hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
            >
              Sign In / Register
            </button>
          )}

        </div>
      </div>

      {/* Quick Search Modal Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 border border-[#E8D8B9]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#242424] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#146C5A]" /> Quick House Search
              </h3>
              <button onClick={() => setIsSearchOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickSearch} className="flex gap-2">
              <input
                type="text"
                value={searchFilters.keyword}
                onChange={e => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="Search location, apartment name, city (e.g. Kilimani, Westlands, Nakuru)..."
                className="flex-1 px-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:outline-none focus:ring-2 focus:ring-[#146C5A]"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#146C5A] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
