import React, { useState, useEffect } from 'react';
import { Booking } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  MapPin, 
  AlertTriangle,
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const BookingsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast, openAuthModal, setActiveTab, setActiveConversationId } = usePlatform();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantBookings();
  }, [user]);

  const fetchTenantBookings = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.getBookings(user.id, user.role);
      setBookings(res);
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel your booking request for "${booking.houseTitle}"?`);
    if (!confirmCancel) return;

    setCancellingId(booking.id);
    try {
      await api.cancelBooking(booking.id, 'Cancelled by tenant request.');
      showToast('Booking Cancelled', 'The booking request was cancelled. If previously accepted, the house is now available again.', 'info');
      fetchTenantBookings();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleMessageLandlord = async (booking: Booking) => {
    if (!user) return;
    try {
      const res = await api.sendMessage({
        senderId: user.id,
        receiverId: booking.landlordId,
        houseId: booking.houseId,
        text: `Hi ${booking.landlordName}, regarding my booking request for "${booking.houseTitle}".`,
      });
      setActiveConversationId(res.conversation.id);
      setActiveTab('messages');
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-md mx-auto my-8">
        <CalendarCheck className="w-12 h-12 text-[#146C5A] mx-auto opacity-40" />
        <h2 className="text-lg font-extrabold text-[#242424]">Sign In to View Bookings</h2>
        <p className="text-xs text-gray-500">Track active booking requests and manage tenant appointments.</p>
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
            <CalendarCheck className="w-5 h-5 text-[#146C5A]" /> My Booking Requests
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            You can make multiple booking requests simultaneously and cancel at any time.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('search')}
          className="px-4 py-2 bg-[#146C5A] text-white text-xs font-bold rounded-xl"
        >
          Explore More Houses
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-3">
          <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No booking requests submitted yet.</p>
          <p className="text-xs text-gray-500">When you find a house you like, tap "Submit Booking Request" on the listing page.</p>
          <button
            onClick={() => setActiveTab('home')}
            className="py-2.5 px-5 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Find a Rental House
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => {
            const isPending = booking.status === 'pending';
            const isAccepted = booking.status === 'accepted';
            const isRejected = booking.status === 'rejected';
            const isCancelled = booking.status === 'cancelled';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={booking.houseImage || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400'}
                    alt={booking.houseTitle}
                    className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-gray-200"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isAccepted ? 'bg-[#2E8B57]/10 text-[#2E8B57]' :
                        isPending ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-[#C13F4A]'
                      }`}>
                        {isAccepted && 'Accepted 🎉'}
                        {isPending && 'Pending Landlord Response'}
                        {isRejected && 'Declined / Closed'}
                        {isCancelled && 'Cancelled'}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        Requested: {booking.createdAt.split('T')[0]}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#242424]">{booking.houseTitle}</h3>
                    <p className="text-xs font-bold text-[#146C5A]">
                      KES {booking.houseRent.toLocaleString()}/month
                    </p>

                    <div className="text-xs text-gray-500 pt-0.5">
                      Landlord: <span className="font-bold text-gray-800">{booking.landlordName}</span> ({booking.landlordPhone})
                    </div>

                    {booking.rejectionReason && (
                      <p className="text-[11px] text-[#C13F4A] bg-red-50 p-2 rounded-xl border border-red-100 mt-1">
                        Reason: {booking.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  <button
                    onClick={() => handleMessageLandlord(booking)}
                    className="flex-1 sm:flex-initial py-2 px-3 bg-[#F8F9FA] hover:bg-gray-100 text-[#146C5A] border border-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message Landlord
                  </button>

                  <a
                    href={`tel:${booking.landlordPhone}`}
                    className="flex-1 sm:flex-initial py-2 px-3 bg-[#E8D8B9]/30 text-[#B66A32] border border-[#B66A32]/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call Landlord
                  </a>

                  {/* CANCEL BOOKING AT ANY TIME */}
                  {!isCancelled && (
                    <button
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 text-[#C13F4A] border border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                      title="Cancel Booking (House automatically returns to search results)"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel Request
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
