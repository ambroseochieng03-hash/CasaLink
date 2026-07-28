import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Settings, ShieldCheck, Smartphone, Globe, Bell, CheckCircle2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { NotificationPreferences } from '../../types';

export const SettingsView: React.FC = () => {
  const { deviceView, setDeviceView, showToast } = usePlatform();
  const { user, login } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    promotional: user?.notificationPreferences?.promotional ?? true,
    recommendations: user?.notificationPreferences?.recommendations ?? true,
    reminders: user?.notificationPreferences?.reminders ?? true,
    generalEngagement: user?.notificationPreferences?.generalEngagement ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!user) {
      showToast('Sign in Required', 'Please sign in to update notification settings.', 'info');
      return;
    }

    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setIsSaving(true);

    try {
      const res = await api.updateNotificationPreferences(user.id, updated);
      login(res.user);
      showToast('Settings Updated', 'Notification preferences saved successfully.', 'success');
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to update preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerEngagement = async () => {
    if (!user) return;
    setIsTriggering(true);
    try {
      const res = await api.triggerEngagement(user.id);
      showToast('AI Assistant Engaged', `Generated ${res.createdCount} new personalized notification(s). Check your bell icon!`, 'success');
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      <div className="bento-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#242424] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#146C5A]" /> Application Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">CasaLink housing platform preferences & AI controls.</p>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="bento-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#146C5A]" />
            <div>
              <h2 className="text-sm font-extrabold text-[#242424]">AI & Notification Controls</h2>
              <p className="text-[11px] text-gray-500">Tailor how CasaLink interacts and communicates with you.</p>
            </div>
          </div>
          {user && (
            <button
              onClick={handleTriggerEngagement}
              disabled={isTriggering}
              className="px-3 py-1.5 bg-[#146C5A]/10 text-[#146C5A] hover:bg-[#146C5A]/20 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B66A32]" />
              {isTriggering ? 'Engaging...' : 'Check Engagement'}
            </button>
          )}
        </div>

        <div className="space-y-3 pt-1">
          {/* Toggle 1: Promotional */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-100">
            <div>
              <span className="text-xs font-bold text-[#242424] block">📢 Promotional Notifications</span>
              <span className="text-[11px] text-gray-500 block">Announcements, platform updates, and feature highlights</span>
            </div>
            <button
              onClick={() => handleToggle('promotional')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                prefs.promotional ? 'bg-[#146C5A]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  prefs.promotional ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Recommendations */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-100">
            <div>
              <span className="text-xs font-bold text-[#242424] block">🏡 Smart House Recommendations</span>
              <span className="text-[11px] text-gray-500 block">Personalized property suggestions based on your search & budget history</span>
            </div>
            <button
              onClick={() => handleToggle('recommendations')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                prefs.recommendations ? 'bg-[#146C5A]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  prefs.recommendations ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3: Viewing & Booking Reminders */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-100">
            <div>
              <span className="text-xs font-bold text-[#242424] block">⏰ Viewing & Booking Reminders</span>
              <span className="text-[11px] text-gray-500 block">Helpful automated reminders prior to scheduled house visits</span>
            </div>
            <button
              onClick={() => handleToggle('reminders')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                prefs.reminders ? 'bg-[#146C5A]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  prefs.reminders ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 4: Daily Engagement & Advice */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FA] border border-gray-100">
            <div>
              <span className="text-xs font-bold text-[#242424] block">✨ Daily Engagement & Housing Tips</span>
              <span className="text-[11px] text-gray-500 block">Good morning greetings, housing tips, rental advice, safety reminders, and encouragement</span>
            </div>
            <button
              onClick={() => handleToggle('generalEngagement')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                prefs.generalEngagement ? 'bg-[#146C5A]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  prefs.generalEngagement ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-3 bg-[#146C5A]/5 rounded-2xl border border-[#146C5A]/20 text-[11px] text-[#146C5A] font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>Critical System Notifications</strong> (Viewing approvals, landlord/tenant direct messages, account security alerts) are always active for your safety.
          </span>
        </div>
      </div>

      {/* Platform Zero-Commission Guarantee Banner */}
      <div className="p-6 bg-gradient-to-r from-[#146C5A] to-[#0E5244] text-white rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-[#E8D8B9] font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-5 h-5 text-[#E8D8B9]" /> Guaranteed Core Principles
        </div>
        <h2 className="text-lg font-extrabold">CasaLink strictly connects landlords & tenants.</h2>
        <ul className="text-xs text-[#E8D8B9] space-y-1.5 opacity-90 font-medium">
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2E8B57]" /> NO Rent Payments on Platform</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2E8B57]" /> NO Security Deposit Payments</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2E8B57]" /> NO Platform In-App Wallet</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2E8B57]" /> NO Middleman Agent Commissions</li>
        </ul>
      </div>

      {/* Device View Frame Toggle */}
      <div className="bento-card p-6 space-y-3">
        <h3 className="text-xs font-extrabold text-[#242424] uppercase tracking-wider">Display Mode</h3>
        <p className="text-xs text-gray-500">
          Switch between full Responsive Desktop Web layout and the Android Native Mobile frame simulator.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => { setDeviceView('web'); showToast('Web Mode', 'Switched to responsive web view.', 'info'); }}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              deviceView === 'web'
                ? 'bg-[#146C5A] text-white border-[#146C5A] shadow-md'
                : 'bg-[#F8F9FA] text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Globe className="w-6 h-6" />
            <div>
              <span className="text-xs font-bold block">Responsive Web</span>
              <span className="text-[10px] opacity-80 block">Full browser layout</span>
            </div>
          </button>

          <button
            onClick={() => { setDeviceView('android'); showToast('Android View', 'Switched to Android App device preview frame.', 'info'); }}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
              deviceView === 'android'
                ? 'bg-[#146C5A] text-white border-[#146C5A] shadow-md'
                : 'bg-[#F8F9FA] text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Smartphone className="w-6 h-6" />
            <div>
              <span className="text-xs font-bold block">Android App</span>
              <span className="text-[10px] opacity-80 block">Mobile frame view</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
};
