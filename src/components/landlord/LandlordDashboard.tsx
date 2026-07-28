import React, { useState, useEffect } from 'react';
import { House, Booking, DescriptionEnhancementResult, PhotoQualityAnalysisResult } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { MapViewer } from '../common/MapViewer';
import { 
  Building2, 
  PlusSquare, 
  CalendarCheck, 
  Eye, 
  ShieldAlert, 
  Phone, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Video, 
  MapPin, 
  Bed, 
  Bath, 
  Sparkles,
  AlertCircle,
  Check,
  X,
  Camera
} from 'lucide-react';

export const LandlordDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab, setIsPhoneVerifyModalOpen, showToast, openHouseDetails } = usePlatform();

  const [myHouses, setMyHouses] = useState<House[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State for Adding/Editing House
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [houseType, setHouseType] = useState('Apartment');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [rent, setRent] = useState(35000);
  const [deposit, setDeposit] = useState(35000);
  const [photoUrls, setPhotoUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1000'
  ]);
  const [newPhotoInput, setNewPhotoInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [location, setLocation] = useState({
    address: 'Argwings Kodhek, Kilimani',
    city: 'Nairobi',
    county: 'Nairobi',
    lat: -1.2913,
    lng: 36.7865,
  });
  const [amenities, setAmenities] = useState<string[]>(['Borehole Water', 'CCTV Security', 'Parking', 'WiFi Ready']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Assistant States
  const [isEnhancingDesc, setIsEnhancingDesc] = useState(false);
  const [enhancedProposal, setEnhancedProposal] = useState<DescriptionEnhancementResult | null>(null);

  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoQualityAnalysisResult | null>(null);

  const handleEnhanceDescription = async () => {
    if (!description.trim()) {
      showToast('Description Required', 'Please enter a brief property description first before AI enhancement.', 'info');
      return;
    }
    setIsEnhancingDesc(true);
    try {
      const res = await api.enhanceDescription({
        title,
        houseType,
        bedrooms,
        rent,
        location,
        description,
        amenities,
      });
      setEnhancedProposal(res);
      showToast('AI Copy Generated', 'Review the AI enhanced description below.', 'success');
    } catch (e: any) {
      showToast('Error', e.message || 'Failed to enhance description', 'error');
    } finally {
      setIsEnhancingDesc(false);
    }
  };

  const handleApplyEnhancedDescription = () => {
    if (!enhancedProposal) return;
    setTitle(enhancedProposal.enhancedTitle);
    setDescription(enhancedProposal.enhancedDescription);
    if (enhancedProposal.suggestedAmenities && enhancedProposal.suggestedAmenities.length > 0) {
      const combined = Array.from(new Set([...amenities, ...enhancedProposal.suggestedAmenities]));
      setAmenities(combined);
    }
    setEnhancedProposal(null);
    showToast('Applied!', 'Title, description & suggested amenities updated.', 'success');
  };

  const handleAnalyzePhotos = async () => {
    setIsAnalyzingPhotos(true);
    try {
      const res = await api.analyzePhotos({
        photoUrls,
        houseType,
        title,
      });
      setPhotoAnalysis(res);
      showToast('Photo Check Complete', `Overall quality score: ${res.overallScore}/10`, 'info');
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsAnalyzingPhotos(false);
    }
  };

  const availableAmenitiesList = [
    'Borehole Water', 'Backup Generator', 'CCTV Security', 'Parking', 
    'WiFi Ready', 'Solar Water Heater', 'Balcony', 'Private Garden', 
    'Cabro Paved', 'Security Guard', 'Pet Friendly'
  ];

  useEffect(() => {
    fetchLandlordData();
  }, [user, activeTab]);

  const fetchLandlordData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const housesRes = await api.getHouses({ landlordId: user.id });
      setMyHouses(housesRes);

      const bookingsRes = await api.getBookings(user.id, 'landlord');
      setMyBookings(bookingsRes);
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetHouseForm = () => {
    setEditingHouseId(null);
    setTitle('');
    setDescription('');
    setHouseType('Apartment');
    setBedrooms(2);
    setBathrooms(2);
    setRent(30000);
    setDeposit(30000);
    setPhotoUrls([
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000'
    ]);
    setVideoUrl('');
    setLocation({
      address: 'Kilimani, Nairobi',
      city: 'Nairobi',
      county: 'Nairobi',
      lat: -1.2913,
      lng: 36.7865,
    });
    setAmenities(['Borehole Water', 'Security']);
  };

  const handleAddPhoto = () => {
    if (!newPhotoInput.trim()) return;
    if (photoUrls.length >= 15) {
      showToast('Limit Reached', 'Maximum 15 photos per house allowed.', 'error');
      return;
    }
    setPhotoUrls(prev => [...prev, newPhotoInput.trim()]);
    setNewPhotoInput('');
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAmenityToggle = (am: string) => {
    setAmenities(prev => 
      prev.includes(am) ? prev.filter(a => a !== am) : [...prev, am]
    );
  };

  const handleSaveHouseForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.isPhoneVerified) {
      showToast('Verification Required', 'Please verify your phone number before publishing property listings.', 'error');
      setIsPhoneVerifyModalOpen(true);
      return;
    }

    if (photoUrls.length === 0) {
      showToast('Photo Required', 'Please provide at least 1 photo for your listing.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        landlordId: user.id,
        title,
        description,
        houseType,
        bedrooms,
        bathrooms,
        rent,
        deposit,
        location,
        amenities,
        photos: photoUrls,
        videoUrl,
      };

      if (editingHouseId) {
        await api.updateHouse(editingHouseId, payload);
        showToast('House Updated', `Updated listing for "${title}".`, 'success');
      } else {
        await api.createHouse(payload);
        showToast('House Published! 🎉', `New property "${title}" listed successfully.`, 'success');
      }

      resetHouseForm();
      setActiveTab('my_houses');
      fetchLandlordData();
    } catch (err: any) {
      showToast('Submission Failed', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (house: House) => {
    setEditingHouseId(house.id);
    setTitle(house.title);
    setDescription(house.description);
    setHouseType(house.houseType);
    setBedrooms(house.bedrooms);
    setBathrooms(house.bathrooms);
    setRent(house.rent);
    setDeposit(house.deposit);
    setPhotoUrls(house.photos || []);
    setVideoUrl(house.videoUrl || '');
    setLocation(house.location);
    setAmenities(house.amenities || []);
    setActiveTab('add_house');
  };

  const handleDeleteHouse = async (house: House) => {
    const confirmDel = window.confirm(`Delete property "${house.title}"? This cannot be undone.`);
    if (!confirmDel) return;

    try {
      await api.deleteHouse(house.id);
      showToast('Deleted', `Property "${house.title}" was removed.`, 'info');
      fetchLandlordData();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await api.updateBookingStatus(bookingId, action);
      if (action === 'accept') {
        showToast('Booking Accepted! 🎉', 'The house status is now set to Booked and hidden from search. All other pending requests for this house were automatically declined.', 'success');
      } else {
        showToast('Booking Declined', 'The booking request was declined.', 'info');
      }
      fetchLandlordData();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleToggleAvailability = async (house: House) => {
    try {
      await api.updateHouse(house.id, { isAvailable: !house.isAvailable });
      showToast('Status Updated', `House is now ${!house.isAvailable ? 'Available' : 'Marked Occupied'}.`, 'success');
      fetchLandlordData();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Landlord Unverified Phone Banner */}
      {user && !user.isPhoneVerified && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#B66A32] shrink-0" />
            <div>
              <h3 className="text-sm font-extrabold text-amber-900">Phone Verification Required</h3>
              <p className="text-xs text-amber-800 leading-snug">
                You must verify your phone number before you can publish or edit property listings.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPhoneVerifyModalOpen(true)}
            className="py-2.5 px-5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-md shrink-0 flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#E8D8B9]" />
            Verify Phone Number Now
          </button>
        </div>
      )}

      {/* Analytics Overview Cards in Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 bento-card-primary flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#E8D8B9] uppercase tracking-wider block">Active Properties</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{myHouses.length} / 10</span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Building2 className="w-7 h-7 text-[#E8D8B9]" />
          </div>
        </div>

        <div className="p-6 bento-card-cream flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#146C5A] uppercase tracking-wider block">Booking Requests</span>
            <span className="text-3xl font-extrabold text-[#B66A32] mt-1 block">
              {myBookings.filter(b => b.status === 'pending').length}
            </span>
          </div>
          <div className="p-3 bg-[#146C5A]/10 rounded-2xl">
            <CalendarCheck className="w-7 h-7 text-[#B66A32]" />
          </div>
        </div>

        <div className="p-6 bento-card-accent flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">Property Views</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {myHouses.reduce((acc, h) => acc + (h.viewCount || 0), 0)}
            </span>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl">
            <Eye className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-xs max-w-md">
        <button
          onClick={() => setActiveTab('my_houses')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'my_houses' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600 hover:text-[#146C5A]'
          }`}
        >
          My Properties ({myHouses.length})
        </button>

        <button
          onClick={() => setActiveTab('add_house')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'add_house' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600 hover:text-[#146C5A]'
          }`}
        >
          {editingHouseId ? 'Edit House' : '+ Add New House'}
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'bookings' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600 hover:text-[#146C5A]'
          }`}
        >
          Requests ({myBookings.filter(b => b.status === 'pending').length})
        </button>
      </div>

      {/* VIEW 1: MY HOUSES LIST */}
      {activeTab === 'my_houses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#242424] uppercase tracking-wider">Property Listings</h2>
            <button
              onClick={() => { resetHouseForm(); setActiveTab('add_house'); }}
              disabled={!user?.isPhoneVerified || myHouses.length >= 10}
              className="py-2 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <PlusSquare className="w-4 h-4 text-[#E8D8B9]" /> Add New Property
            </button>
          </div>

          {myHouses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-3">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">No properties listed yet.</p>
              <p className="text-xs text-gray-500">List up to 10 active rental houses with photos, videos, and GPS map pins.</p>
              <button
                onClick={() => { resetHouseForm(); setActiveTab('add_house'); }}
                className="py-2.5 px-5 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Add Your First Property
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {myHouses.map(house => (
                <div key={house.id} className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 bg-gray-100">
                      <img src={house.photos[0]} alt={house.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleToggleAvailability(house)}
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-md ${
                          house.isAvailable ? 'bg-[#2E8B57] text-white' : 'bg-[#C13F4A] text-white'
                        }`}
                      >
                        {house.isAvailable ? 'Marked Available' : 'Marked Occupied'}
                      </button>
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-md flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {house.viewCount} views
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-extrabold text-[#242424] line-clamp-1">{house.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#B66A32]" /> {house.location.address}, {house.location.city}
                      </p>
                      <p className="text-sm font-extrabold text-[#146C5A]">
                        KES {house.rent.toLocaleString()}/mo
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F8F9FA] border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openHouseDetails(house)}
                      className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleEditClick(house)}
                      className="px-3 py-2 bg-[#146C5A]/10 text-[#146C5A] rounded-xl text-xs font-bold hover:bg-[#146C5A]/20 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteHouse(house)}
                      className="p-2 bg-red-50 text-[#C13F4A] rounded-xl text-xs font-bold hover:bg-red-100"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ADD / EDIT HOUSE FORM */}
      {activeTab === 'add_house' && (
        <form onSubmit={handleSaveHouseForm} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#242424]">
                {editingHouseId ? 'Edit Property Listing' : 'Publish New Rental House'}
              </h2>
              <p className="text-xs text-gray-500">Provide authentic photos, walkthrough video link, and exact GPS coordinates.</p>
            </div>
            {editingHouseId && (
              <button
                type="button"
                onClick={resetHouseForm}
                className="px-3 py-1.5 bg-gray-100 text-xs font-bold rounded-xl"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Property Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Spacious 2 Bedroom Apartment with Balcony & Borehole"
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">House Type</label>
              <select
                value={houseType}
                onChange={e => setHouseType(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              >
                <option value="Apartment">Apartment</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Mansionette">Mansionette</option>
                <option value="Studio">Studio</option>
                <option value="Single Room">Single Room</option>
                <option value="Villa">Villa</option>
                <option value="Townhouse">Townhouse</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bedrooms}
                  onChange={e => setBedrooms(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bathrooms}
                  onChange={e => setBathrooms(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Rent (KES)</label>
              <input
                type="number"
                required
                step={500}
                value={rent}
                onChange={e => setRent(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs font-bold text-[#146C5A] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Required (KES)</label>
              <input
                type="number"
                required
                step={500}
                value={deposit}
                onChange={e => setDeposit(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs font-bold text-[#B66A32] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              />
            </div>

            {/* Property Description with AI Copywriting Assistant */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">Property Description</label>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancingDesc}
                  className="px-3 py-1 bg-[#146C5A]/10 text-[#146C5A] hover:bg-[#146C5A]/20 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B66A32]" />
                  {isEnhancingDesc ? 'Crafting Copy...' : '✨ Enhance with AI Copywriter'}
                </button>
              </div>

              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe neighborhood features, water availability, security, proximity to schools or transport..."
                className="w-full p-3 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              />

              {/* AI Enhanced Description Proposal Modal/Banner */}
              {enhancedProposal && (
                <div className="p-4 bg-gradient-to-r from-[#146C5A]/5 to-[#B66A32]/10 border border-[#146C5A]/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#146C5A] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#B66A32]" /> AI Description Proposal
                    </span>
                    <button
                      type="button"
                      onClick={() => setEnhancedProposal(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Suggested Title</span>
                    <p className="text-xs font-bold text-[#242424]">{enhancedProposal.enhancedTitle}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Enhanced Description</span>
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{enhancedProposal.enhancedDescription}</p>
                  </div>

                  {enhancedProposal.keyHighlights && enhancedProposal.keyHighlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {enhancedProposal.keyHighlights.map((hl, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-[#146C5A]/20 rounded-lg text-[10px] font-semibold text-[#146C5A]">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEnhancedProposal(null)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyEnhancedDescription}
                      className="px-4 py-1.5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Apply AI Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Photos Upload List with AI Quality Assistant */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                <span>Photos ({photoUrls.length} / 15 Max)</span>
                <button
                  type="button"
                  onClick={handleAnalyzePhotos}
                  disabled={isAnalyzingPhotos}
                  className="px-2.5 py-1 bg-[#146C5A]/10 text-[#146C5A] hover:bg-[#146C5A]/20 font-bold text-[11px] rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5 text-[#146C5A]" />
                  {isAnalyzingPhotos ? 'Analyzing...' : '📸 AI Photo Quality Check'}
                </button>
              </div>

              {/* AI Photo Quality Analysis Feedback */}
              {photoAnalysis && (
                <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#242424]">AI Listing Photo Health</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        photoAnalysis.overallScore >= 8 ? 'bg-emerald-100 text-emerald-800' :
                        photoAnalysis.overallScore >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        Score: {photoAnalysis.overallScore} / 10
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoAnalysis(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {photoAnalysis.feedback && photoAnalysis.feedback.length > 0 && (
                    <ul className="text-[11px] text-gray-600 space-y-1">
                      {photoAnalysis.feedback.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#146C5A] font-bold">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  {photoAnalysis.missingElements && photoAnalysis.missingElements.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Recommended Missing Angles:</span>
                      <div className="flex flex-wrap gap-1">
                        {photoAnalysis.missingElements.map((m, i) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-medium">
                            + {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhotoInput}
                  onChange={e => setNewPhotoInput(e.target.value)}
                  placeholder="Paste image URL (Unsplash or direct image link)..."
                  className="flex-1 px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-2 bg-[#146C5A] text-white text-xs font-bold rounded-xl"
                >
                  Add Photo
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto py-2">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-md text-[10px]"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Walkthrough (Max 1 video) */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-gray-700">Video Walkthrough URL (Max 60 Seconds)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://commondatastorage.googleapis.com/... (Direct .mp4 link)"
                className="w-full px-4 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
              />
            </div>

            {/* Amenities Grid */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-gray-700">Select Available Amenities</label>
              <div className="flex flex-wrap gap-2">
                {availableAmenitiesList.map(am => {
                  const checked = amenities.includes(am);
                  return (
                    <button
                      key={am}
                      type="button"
                      onClick={() => handleAmenityToggle(am)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        checked ? 'bg-[#146C5A] text-white' : 'bg-[#F8F9FA] text-gray-600 border border-gray-200'
                      }`}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Address & GPS Pin Picker */}
            <div className="md:col-span-2 space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-700">Location & GPS Pin Placement</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={location.address}
                  onChange={e => setLocation(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street / Estate Address"
                  className="px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  value={location.city}
                  onChange={e => setLocation(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City (e.g. Nairobi)"
                  className="px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
                />
                <input
                  type="text"
                  required
                  value={location.county}
                  onChange={e => setLocation(prev => ({ ...prev, county: e.target.value }))}
                  placeholder="County"
                  className="px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs"
                />
              </div>

              <MapViewer
                location={location}
                isPicker={true}
                onLocationSelect={(coords) => setLocation(prev => ({ ...prev, ...coords }))}
                height="240px"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting || !user?.isPhoneVerified}
            className="w-full py-3.5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-xs rounded-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Property...' : (editingHouseId ? 'Update Listing' : 'Publish Property Listing')}
          </button>
        </form>
      )}

      {/* VIEW 3: BOOKING REQUESTS MANAGER */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-[#242424] uppercase tracking-wider">Tenant Booking Requests</h2>

          {myBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-2">
              <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">No booking requests received yet.</p>
              <p className="text-xs text-gray-500">When tenants tap "Submit Booking Request" on your houses, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map(b => (
                <div key={b.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-4 items-center">
                    <img src={b.houseImage} alt="" className="w-20 h-20 rounded-2xl object-cover border" />
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'accepted' ? 'bg-[#2E8B57]/10 text-[#2E8B57]' :
                        b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-[#C13F4A]'
                      }`}>
                        {b.status}
                      </span>
                      <h3 className="text-sm font-extrabold text-[#242424] mt-1">{b.houseTitle}</h3>
                      <p className="text-xs text-gray-600">
                        Tenant: <span className="font-bold text-[#146C5A]">{b.tenantName}</span> ({b.tenantPhone})
                      </p>
                      <span className="text-[11px] text-gray-400">Date: {b.createdAt.split('T')[0]}</span>
                    </div>
                  </div>

                  {b.status === 'pending' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleBookingAction(b.id, 'accept')}
                        className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleBookingAction(b.id, 'reject')}
                        className="flex-1 sm:flex-initial py-2.5 px-4 bg-red-50 text-[#C13F4A] hover:bg-red-100 font-bold text-xs rounded-xl"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
