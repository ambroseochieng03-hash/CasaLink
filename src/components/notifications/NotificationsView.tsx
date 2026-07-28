import React, { useState, useEffect } from 'react';
import { AppNotification } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  CalendarCheck, 
  Sparkles,
  CheckCheck
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, refreshNotifications, openAuthModal } = usePlatform();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, [user]);

  const fetchNotifs = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getNotifications(user.id);
      setNotifications(res);
    } catch (e: any) {
      // quiet
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      refreshNotifications();
    } catch (e: any) {
      // quiet
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await api.markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      refreshNotifications();
      showToast('Notifications Cleared', 'All notifications marked as read.', 'info');
    } catch (e: any) {
      // quiet
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-md mx-auto my-8">
        <Bell className="w-12 h-12 text-[#146C5A] mx-auto opacity-40" />
        <h2 className="text-lg font-extrabold text-[#242424]">Sign In for Notifications</h2>
        <p className="text-xs text-gray-500">Stay updated on booking acceptances, declines, and messages.</p>
        <button onClick={() => openAuthModal('login')} className="px-6 py-3 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-md">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#242424] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#146C5A]" /> Notifications
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time alerts for booking updates and messages.</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4 text-[#146C5A]" /> Mark All as Read
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-2">
          <Bell className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                !n.read
                  ? 'bg-white border-[#146C5A]/40 shadow-xs ring-1 ring-[#146C5A]/20'
                  : 'bg-white border-gray-200/80 opacity-80'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                n.type === 'booking_accepted' ? 'bg-green-100 text-[#2E8B57]' :
                n.type === 'booking_rejected' ? 'bg-red-100 text-[#C13F4A]' :
                'bg-[#146C5A]/10 text-[#146C5A]'
              }`}>
                {n.type === 'booking_accepted' ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#242424]">{n.title}</h4>
                  <span className="text-[10px] text-gray-400">{n.createdAt.split('T')[0]}</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#146C5A] shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
