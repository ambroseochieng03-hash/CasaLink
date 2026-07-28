import React, { useState, useEffect } from 'react';
import { User, House, PlatformStats, Announcement } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  CalendarCheck, 
  MessageSquare, 
  Megaphone, 
  Ban, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Eye
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast, openHouseDetails } = usePlatform();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [housesList, setHousesList] = useState<House[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'houses' | 'broadcast'>('stats');

  // Broadcast form state
  const [ancTitle, setAncTitle] = useState('');
  const [ancBody, setAncBody] = useState('');
  const [ancRole, setAncRole] = useState<'all' | 'tenant' | 'landlord'>('all');
  const [isSendingAnc, setIsSendingAnc] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const s = await api.getAdminStats();
      setStats(s);

      const u = await api.getAdminUsers();
      setUsersList(u);

      const h = await api.getHouses();
      setHousesList(h);

      const a = await api.getAnnouncements();
      setAnnouncements(a);
    } catch (e: any) {
      // quiet
    }
  };

  const handleToggleSuspend = async (usr: User) => {
    try {
      await api.suspendUser(usr.id);
      showToast('Account Updated', `User ${usr.fullName} is now ${!usr.isSuspended ? 'Suspended' : 'Reactivated'}.`, 'info');
      fetchAdminData();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleRemoveFakeListing = async (house: House) => {
    const confirmRemove = window.confirm(`Remove listing "${house.title}" from CasaLink?`);
    if (!confirmRemove) return;

    try {
      await api.deleteHouse(house.id);
      showToast('Listing Removed', `Removed property "${house.title}".`, 'success');
      fetchAdminData();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle || !ancBody) return;

    setIsSendingAnc(true);
    try {
      await api.createAnnouncement({ title: ancTitle, body: ancBody, targetRole: ancRole });
      showToast('Announcement Broadcasted! 📢', `Sent announcement to ${ancRole} users.`, 'success');
      setAncTitle('');
      setAncBody('');
      fetchAdminData();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsSendingAnc(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-md mx-auto my-8">
        <ShieldCheck className="w-12 h-12 text-[#146C5A] mx-auto opacity-40" />
        <h2 className="text-lg font-extrabold text-[#242424]">Admin Access Restricted</h2>
        <p className="text-xs text-gray-500">Use the top menu demo role switcher to test Admin Console features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bento-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#242424] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#146C5A]" /> CasaLink Platform Administration
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage users, moderate fake listings, and send broadcast announcements.</p>
        </div>

        <div className="flex bg-[#E8D8B9]/30 p-1 rounded-2xl border border-[#E8D8B9]">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'stats' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('houses')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'houses' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Houses ({housesList.length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'broadcast' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Announce
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-6 bento-card-primary">
            <span className="text-xs font-bold text-[#E8D8B9] uppercase tracking-wider block">Total Users</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{stats.totalUsers}</span>
            <span className="text-[11px] text-[#E8D8B9]/90 block mt-1">{stats.totalTenants} Tenants • {stats.totalLandlords} Landlords</span>
          </div>

          <div className="p-6 bento-card-cream">
            <span className="text-xs font-bold text-[#146C5A] uppercase tracking-wider block">Listed Properties</span>
            <span className="text-3xl font-extrabold text-[#146C5A] mt-1 block">{stats.totalHouses}</span>
            <span className="text-[11px] text-[#2E8B57] font-bold block mt-1">{stats.availableHouses} Available Now</span>
          </div>

          <div className="p-6 bento-card-accent">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">Active Bookings</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{stats.activeBookings}</span>
            <span className="text-[11px] text-white/90 block mt-1">Tenant Viewing Requests</span>
          </div>

          <div className="p-6 bento-card">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Platform Messages</span>
            <span className="text-3xl font-extrabold text-[#242424] mt-1 block">{stats.totalMessages}</span>
            <span className="text-[11px] text-gray-500 block mt-1">Tenant-Landlord Chats</span>
          </div>
        </div>
      )}

      {/* MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-wider">
            Registered Users ({usersList.length})
          </div>
          <div className="divide-y divide-gray-100">
            {usersList.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-2xl object-cover border" />
                  <div>
                    <h4 className="text-xs font-extrabold text-[#242424] flex items-center gap-2">
                      {u.fullName}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'landlord' ? 'bg-[#146C5A]/10 text-[#146C5A]' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-500">{u.email} • {u.phoneNumber}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleSuspend(u)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    u.isSuspended ? 'bg-red-100 text-[#C13F4A]' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-[#C13F4A]'
                  }`}
                >
                  {u.isSuspended ? 'Suspended (Reactivate)' : 'Suspend Account'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MANAGE HOUSES MODERATION */}
      {activeTab === 'houses' && (
        housesList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 text-center space-y-2">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No properties listed on CasaLink yet.</p>
            <p className="text-xs text-gray-500">Newly added houses uploaded by landlords will appear here for moderation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {housesList.map(h => (
              <div key={h.id} className="bg-white rounded-3xl border border-gray-200 p-4 space-y-3 shadow-xs">
                <img src={h.photos[0]} alt="" className="w-full h-36 object-cover rounded-2xl border" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#242424] line-clamp-1">{h.title}</h4>
                  <p className="text-[11px] text-gray-500">Owner: {h.landlordName} ({h.landlordPhone})</p>
                  <p className="text-xs font-bold text-[#146C5A] mt-1">KES {h.rent.toLocaleString()}/mo</p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => openHouseDetails(h)}
                    className="flex-1 py-1.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => handleRemoveFakeListing(h)}
                    className="px-3 py-1.5 bg-red-50 text-[#C13F4A] hover:bg-red-100 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Fake
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* BROADCAST ANNOUNCEMENTS */}
      {activeTab === 'broadcast' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-extrabold text-[#242424] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#146C5A]" /> Send Platform Broadcast Announcement
            </h2>
            <p className="text-xs text-gray-500">Send system notices to all tenants or landlords.</p>
          </div>

          <form onSubmit={handleSendAnnouncement} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Audience</label>
              <select
                value={ancRole}
                onChange={e => setAncRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs font-bold"
              >
                <option value="all">All Users (Tenants & Landlords)</option>
                <option value="tenant">Tenants Only</option>
                <option value="landlord">Landlords Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Announcement Title</label>
              <input
                type="text"
                required
                value={ancTitle}
                onChange={e => setAncTitle(e.target.value)}
                placeholder="e.g. System Maintenance or Policy Update"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Message Body</label>
              <textarea
                rows={3}
                required
                value={ancBody}
                onChange={e => setAncBody(e.target.value)}
                placeholder="Write announcement details..."
                className="w-full p-3 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingAnc}
              className="py-3 px-6 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-[#E8D8B9]" />
              {isSendingAnc ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </form>

          {/* Announcement Logs */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Past Announcements ({announcements.length})</h3>
            <div className="space-y-2">
              {announcements.map(a => (
                <div key={a.id} className="p-3 bg-[#F8F9FA] rounded-2xl border text-xs">
                  <div className="flex justify-between font-bold text-[#242424]">
                    <span>{a.title}</span>
                    <span className="text-gray-400 font-normal">{a.date}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
