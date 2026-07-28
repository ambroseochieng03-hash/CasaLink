import React, { createContext, useContext, useState, useEffect } from 'react';
import { House, SearchFilterState, AppNotification } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export type ViewMode = 'web' | 'android';

export type ActiveTab = 
  | 'home' 
  | 'search' 
  | 'saved' 
  | 'messages' 
  | 'bookings' 
  | 'notifications' 
  | 'profile' 
  | 'settings' 
  | 'my_houses' 
  | 'add_house' 
  | 'admin'
  | 'navigation';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface PlatformContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  deviceView: ViewMode;
  setDeviceView: (mode: ViewMode) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedHouse: House | null;
  setSelectedHouse: (house: House | null) => void;
  openHouseDetails: (house: House) => void;
  isPhoneVerifyModalOpen: boolean;
  setIsPhoneVerifyModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  isAppDownloadModalOpen: boolean;
  setIsAppDownloadModalOpen: (open: boolean) => void;
  savedHouseIds: string[];
  toggleSaveHouse: (houseId: string) => Promise<void>;
  isHouseSaved: (houseId: string) => boolean;
  searchFilters: SearchFilterState;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  toasts: Toast[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  navigatingHouse: House | null;
  setNavigatingHouse: (house: House | null) => void;
  startNavigation: (house?: House) => void;
  stopNavigation: () => void;
}

const defaultFilters: SearchFilterState = {
  keyword: '',
  location: '',
  minRent: 0,
  maxRent: 200000,
  houseType: 'All',
  bedrooms: 'Any',
  amenities: [],
  availabilityOnly: true,
  sortBy: 'newest',
};

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('web');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isPhoneVerifyModalOpen, setIsPhoneVerifyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [isAppDownloadModalOpen, setIsAppDownloadModalOpen] = useState(false);
  const [savedHouseIds, setSavedHouseIds] = useState<string[]>([]);

  // Automatically trigger App Download prompt popup when user opens the link
  useEffect(() => {
    const hasPromptBeenShown = sessionStorage.getItem('casalink_download_prompt_shown');
    if (!hasPromptBeenShown) {
      const timer = setTimeout(() => {
        setIsAppDownloadModalOpen(true);
        sessionStorage.setItem('casalink_download_prompt_shown', 'true');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);
  const [searchFilters, setSearchFilters] = useState<SearchFilterState>(defaultFilters);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [navigatingHouse, setNavigatingHouse] = useState<House | null>(null);

  const startNavigation = (house?: House) => {
    if (house) {
      setNavigatingHouse(house);
    }
    setActiveTab('navigation');
    setSelectedHouse(null); // close details modal if open
  };

  const stopNavigation = () => {
    setNavigatingHouse(null);
    setActiveTab('home');
  };

  // Auto set activeTab based on user role when user changes
  useEffect(() => {
    if (user?.role === 'landlord' && activeTab === 'home') {
      setActiveTab('my_houses');
    } else if (user?.role === 'admin' && activeTab === 'home') {
      setActiveTab('admin');
    } else if (user?.role === 'tenant' && (activeTab === 'my_houses' || activeTab === 'add_house' || activeTab === 'admin')) {
      setActiveTab('home');
    }
  }, [user]);

  // Load saved houses for active user
  useEffect(() => {
    if (user) {
      api.getSavedHouses(user.id)
        .then(res => {
          setSavedHouseIds(res.map(h => h.id));
        })
        .catch(() => {});

      refreshNotifications();
    }
  }, [user]);

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const notifs = await api.getNotifications(user.id);
      const unread = notifs.filter(n => !n.read).length;
      setUnreadNotificationCount(unread);
    } catch (e) {
      // quiet catch
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const openHouseDetails = (house: House) => {
    setSelectedHouse(house);
  };

  const openAuthModal = (tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const toggleSaveHouse = async (houseId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.toggleSavedHouse(user.id, houseId);
      setSavedHouseIds(res.houseIds);
      if (res.isSaved) {
        showToast('House Saved', 'Added to your saved houses bookmarks.', 'success');
      } else {
        showToast('House Removed', 'Removed from your saved houses.', 'info');
      }
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const isHouseSaved = (houseId: string) => savedHouseIds.includes(houseId);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <PlatformContext.Provider value={{
      viewMode,
      setViewMode,
      deviceView: viewMode,
      setDeviceView: setViewMode,
      isSidebarOpen,
      setIsSidebarOpen,
      toggleSidebar,
      activeTab,
      setActiveTab,
      selectedHouse,
      setSelectedHouse,
      openHouseDetails,
      isPhoneVerifyModalOpen,
      setIsPhoneVerifyModalOpen,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authModalInitialTab,
      openAuthModal,
      isAppDownloadModalOpen,
      setIsAppDownloadModalOpen,
      savedHouseIds,
      toggleSaveHouse,
      isHouseSaved,
      searchFilters,
      setSearchFilters,
      toasts,
      showToast,
      removeToast,
      unreadNotificationCount,
      refreshNotifications,
      activeConversationId,
      setActiveConversationId,
      navigatingHouse,
      setNavigatingHouse,
      startNavigation,
      stopNavigation,
    }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within PlatformProvider');
  return ctx;
};
