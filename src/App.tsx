import React from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileSidebar } from './components/common/MobileSidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { PhoneVerificationModal } from './components/common/PhoneVerificationModal';
import { AuthModal } from './components/auth/AuthModal';
import { HouseDetailsModal } from './components/houses/HouseDetailsModal';
import { AppDownloadModal } from './components/common/AppDownloadModal';
import { HomeFeed } from './components/tenant/HomeFeed';
import { SearchHousesView } from './components/tenant/SearchHousesView';
import { SavedHousesView } from './components/tenant/SavedHousesView';
import { BookingsView } from './components/tenant/BookingsView';
import { LandlordDashboard } from './components/landlord/LandlordDashboard';
import { MessagesView } from './components/chat/MessagesView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { NavigationView } from './components/navigation/NavigationView';
import { AndroidShell } from './components/android/AndroidShell';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    deviceView, 
    selectedHouse, 
    setSelectedHouse, 
    isAuthModalOpen, 
    closeAuthModal,
    isPhoneVerifyModalOpen,
    setIsPhoneVerifyModalOpen,
    isAppDownloadModalOpen,
    setIsAppDownloadModalOpen
  } = usePlatform();

  const { user } = useAuth();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeFeed />;
      case 'search':
        return <SearchHousesView />;
      case 'navigation':
        return <NavigationView />;
      case 'saved':
        return <SavedHousesView />;
      case 'bookings':
        return user?.role === 'landlord' ? <LandlordDashboard /> : <BookingsView />;
      case 'my_houses':
      case 'add_house':
        return <LandlordDashboard />;
      case 'messages':
        return <MessagesView />;
      case 'notifications':
        return <NotificationsView />;
      case 'admin':
        return <AdminDashboard />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#242424] flex flex-col font-sans">
      <ToastContainer />

      {/* Global Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      
      <PhoneVerificationModal
        isOpen={isPhoneVerifyModalOpen}
        onClose={() => setIsPhoneVerifyModalOpen(false)}
      />

      <HouseDetailsModal
        house={selectedHouse}
        onClose={() => setSelectedHouse(null)}
      />

      <AppDownloadModal
        isOpen={isAppDownloadModalOpen}
        onClose={() => setIsAppDownloadModalOpen(false)}
      />

      {deviceView === 'android' ? (
        <AndroidShell>
          {renderActiveView()}
        </AndroidShell>
      ) : (
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar />
          <MobileSidebar />
          
          <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 items-start">
            <aside className="hidden md:block shrink-0 sticky top-20 self-start z-30">
              <Sidebar />
            </aside>

            <main className="flex-1 min-w-0">
              {renderActiveView()}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <PlatformProvider>
        <MainAppContent />
      </PlatformProvider>
    </AuthProvider>
  );
}

export default App;
