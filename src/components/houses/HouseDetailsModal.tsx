import React, { useState } from 'react';
import { House } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { api } from '../../services/api';
import { MapViewer } from '../common/MapViewer';
import { 
  X, 
  MapPin, 
  Bed, 
  Bath, 
  CheckCircle2, 
  Bookmark, 
  Share2, 
  MessageSquare, 
  CalendarCheck, 
  PhoneCall, 
  ShieldCheck, 
  Play, 
  Eye, 
  Calendar,
  Sparkles,
  Info,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HouseDetailsModalProps {
  house: House | null;
  onClose: () => void;
}

export const HouseDetailsModal: React.FC<HouseDetailsModalProps> = ({ house, onClose }) => {
  const { user } = useAuth();
  const { isHouseSaved, toggleSaveHouse, showToast, setActiveTab, openAuthModal, setActiveConversationId, startNavigation } = usePlatform();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  React.useEffect(() => {
    if (house && user) {
      api.trackRecentlyViewed(user.id, house.id).catch(() => {});
    }
  }, [house?.id, user?.id]);

  if (!house) return null;

  const saved = isHouseSaved(house.id);

  const handleBook = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (user.role === 'landlord') {
      showToast('Landlord Account', 'Switch to a Tenant account to create booking requests.', 'info');
      return;
    }

    setIsBookingLoading(true);
    try {
      await api.createBooking(house.id, user.id);
      showToast('Booking Request Sent! 🎉', `Your booking request for "${house.title}" was submitted to ${house.landlordName}.`, 'success');
      setActiveTab('bookings');
      onClose();
    } catch (err: any) {
      showToast('Booking Error', err.message, 'error');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleContactLandlord = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.sendMessage({
        senderId: user.id,
        receiverId: house.landlordId,
        houseId: house.id,
        text: `Hi ${house.landlordName}, I am interested in viewing "${house.title}" (KES ${house.rent.toLocaleString()}/mo). Is it available for a walkthrough?`,
      });
      setActiveConversationId(res.conversation.id);
      setActiveTab('messages');
      onClose();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: house.title,
        text: `Check out this rental house on CasaLink: ${house.title} - KES ${house.rent.toLocaleString()}/month`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied', 'Property link copied to clipboard!', 'success');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9980] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-[#E8D8B9] my-6 max-h-[92vh] flex flex-col"
        >
          
          {/* Header Bar */}
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                house.isAvailable ? 'bg-[#2E8B57]/10 text-[#2E8B57]' : 'bg-[#C13F4A]/10 text-[#C13F4A]'
              }`}>
                {house.isAvailable ? 'Available Now' : 'Occupied / Booked'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8D8B9]/40 text-[#146C5A] border border-[#B66A32]/20">
                {house.houseType}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSaveHouse(house.id)}
                className={`p-2.5 rounded-xl border transition-all ${
                  saved ? 'bg-[#146C5A] text-white border-[#146C5A]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title="Save House"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                title="Share Property"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Title & Pricing Banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#242424] leading-tight">
                  {house.title}
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-[#B66A32]" />
                  {house.location.address}, {house.location.city}, {house.location.county}
                </p>
              </div>

              <div className="bg-[#146C5A]/5 p-4 rounded-2xl border border-[#146C5A]/15 shrink-0 text-right md:text-right">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Monthly Rent</span>
                <span className="text-2xl font-extrabold text-[#146C5A]">
                  KES {house.rent.toLocaleString()}
                </span>
                <span className="text-xs text-[#B66A32] font-semibold block mt-0.5">
                  Deposit: KES {house.deposit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Gallery Carousel & Video Player */}
            <div className="space-y-3">
              <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden bg-black border border-gray-200 shadow-md group">
                {!isVideoPlaying ? (
                  <img
                    src={house.photos[activePhotoIndex] || house.photos[0]}
                    alt={house.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                ) : (
                  <video
                    src={house.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                )}

                {/* Video walkthrough trigger badge */}
                {house.videoUrl && !isVideoPlaying && (
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#146C5A]/90 hover:bg-[#146C5A] text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-transform hover:scale-110 border-2 border-[#E8D8B9]"
                  >
                    <Play className="w-7 h-7 text-[#E8D8B9] ml-1 fill-current" />
                  </button>
                )}

                {isVideoPlaying && (
                  <button
                    onClick={() => setIsVideoPlaying(false)}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black text-white text-xs font-bold rounded-xl backdrop-blur-md"
                  >
                    Back to Photos
                  </button>
                )}

                {/* Counter Badge */}
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-md">
                  Photo {activePhotoIndex + 1} of {house.photos.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {house.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActivePhotoIndex(idx); setIsVideoPlaying(false); }}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activePhotoIndex === idx && !isVideoPlaying ? 'border-[#146C5A] ring-2 ring-[#146C5A]/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}

                {house.videoUrl && (
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-[#146C5A] text-white flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
                      isVideoPlaying ? 'border-[#E8D8B9] ring-2 ring-[#E8D8B9]' : 'border-transparent'
                    }`}
                  >
                    <Play className="w-4 h-4 text-[#E8D8B9] fill-current" />
                    Video Tour
                  </button>
                )}
              </div>
            </div>

            {/* Quick Property Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Bed className="w-5 h-5 text-[#146C5A]" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Bedrooms</span>
                  <span className="text-sm font-extrabold text-[#242424]">{house.bedrooms} {house.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Bath className="w-5 h-5 text-[#146C5A]" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Bathrooms</span>
                  <span className="text-sm font-extrabold text-[#242424]">{house.bathrooms} {house.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#146C5A]" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Views</span>
                  <span className="text-sm font-extrabold text-[#242424]">{house.viewCount} Views</span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-2xl border border-gray-200/80 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#146C5A]" />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Listed Date</span>
                  <span className="text-sm font-extrabold text-[#242424]">{house.createdAt.split('T')[0]}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#242424] uppercase tracking-wider">Property Description</h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-[#F8F9FA] p-4 rounded-2xl border border-gray-200/80">
                {house.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#242424] uppercase tracking-wider">Amenities & Features</h3>
              <div className="flex flex-wrap gap-2">
                {house.amenities.map((am, i) => (
                  <span
                    key={i}
                    className="px-3.5 py-2 rounded-xl bg-[#146C5A]/10 text-[#146C5A] text-xs font-bold border border-[#146C5A]/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E8B57]" />
                    {am}
                  </span>
                ))}
              </div>
            </div>

            {/* Landlord Contact Info Box */}
            <div className="p-5 bg-[#E8D8B9]/30 rounded-2xl border border-[#B66A32]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={house.landlordAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'}
                  alt={house.landlordName}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-[#146C5A]"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-extrabold text-[#242424]">{house.landlordName}</h4>
                    <span className="p-0.5 rounded-full bg-[#146C5A] text-white" title="Verified Landlord">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#E8D8B9]" />
                    </span>
                  </div>
                  <p className="text-xs text-[#B66A32] font-bold">{house.landlordPhone}</p>
                  <span className="text-[10px] text-gray-500 block">Verified Property Owner • No Commission</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleContactLandlord}
                  className="flex-1 sm:flex-initial py-2.5 px-4 bg-white hover:bg-gray-50 text-[#146C5A] border border-[#146C5A] font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Message Landlord
                </button>
                
                <a
                  href={`tel:${house.landlordPhone}`}
                  className="py-2.5 px-4 bg-[#B66A32] hover:bg-[#a05b2a] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" /> Call Now
                </a>
              </div>
            </div>

            {/* GPS Location & Live Directions Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#242424] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#146C5A]" />
                  <span>Location & Live Directions</span>
                </h3>
                <span className="text-xs font-semibold text-gray-500">{house.location.address}</span>
              </div>

              <div className="relative rounded-3xl overflow-hidden border border-gray-200">
                <MapViewer location={house.location} height="260px" />
                
                {/* Floating Navigation Trigger Overlay */}
                <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-[#146C5A]/20 shadow-lg flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#242424] flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#146C5A]" /> Built-in CasaLink Voice Navigation
                    </h4>
                    <p className="text-[10px] text-gray-500">Live GPS, turn-by-turn voice prompts & AI assistant guidance</p>
                  </div>

                  <button
                    onClick={() => startNavigation(house)}
                    className="py-2 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0"
                  >
                    <Compass className="w-4 h-4 text-[#E8D8B9] animate-spin-slow" />
                    Start Navigation
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Footer Booking CTA */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
            <div>
              <span className="text-xs text-gray-500 font-medium">Rent Fee</span>
              <p className="text-lg font-extrabold text-[#146C5A]">
                KES {house.rent.toLocaleString()}<span className="text-xs text-gray-500 font-normal"> / month</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleBook}
                disabled={!house.isAvailable || isBookingLoading}
                className={`py-3 px-6 font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
                  house.isAvailable
                    ? 'bg-[#146C5A] hover:bg-[#0E5244] text-white shadow-[#146C5A]/20'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-[#E8D8B9]" />
                {isBookingLoading ? 'Sending Request...' : (house.isAvailable ? 'Submit Booking Request' : 'Occupied / Unavailable')}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
