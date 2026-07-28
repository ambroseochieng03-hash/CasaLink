import React, { useState, useEffect } from 'react';
import { House, RecommendedHouse } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { MapViewer } from '../common/MapViewer';
import { 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Bookmark, 
  Sparkles, 
  Filter, 
  Flame, 
  Compass, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Building2,
  PlusSquare,
  RotateCcw
} from 'lucide-react';

export const HomeFeed: React.FC = () => {
  const { user } = useAuth();
  const { openHouseDetails, isHouseSaved, toggleSaveHouse, activeTab, setActiveTab, setSearchFilters, startNavigation } = usePlatform();
  const [houses, setHouses] = useState<House[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedHouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    setIsLoading(true);
    api.getHouses()
      .then(res => setHouses(res))
      .catch(() => {})
      .finally(() => setIsLoading(false));

    if (user) {
      api.getRecommendations(user.id)
        .then(recs => setRecommendations(recs))
        .catch(() => {});
    }
  }, [user, activeTab]);

  const featuredHouses = houses.filter(h => h.isFeatured || h.rent > 30000);
  const availableHouses = houses.filter(h => h.isAvailable);

  const categories = ['All', 'Apartment', 'Villa', 'Studio', 'Bungalow', 'Townhouse'];

  const filteredHouses = activeCategory === 'All' 
    ? availableHouses 
    : availableHouses.filter(h => h.houseType.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner + Bento Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Bento Hero Card (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#146C5A] via-[#0E5244] to-[#146C5A] text-white p-6 sm:p-8 shadow-xl border border-[#E8D8B9]/30 flex flex-col justify-between">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8D8B9]/20 border border-[#E8D8B9]/40 text-[#E8D8B9] text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#E8D8B9]" /> Direct Connections • Zero Middleman Fees
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Find genuine rental houses quickly without walking door-to-door.
            </h1>
            <p className="text-xs sm:text-sm text-[#E8D8B9] leading-relaxed opacity-90 max-w-xl">
              Browse verified apartments, studio flats, and family bungalows across Nairobi, Mombasa, Nakuru & nationwide with transparent pricing and live GPS locations.
            </p>

            {/* Quick Search Shortcut Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab('search')}
                className="flex-1 px-4 py-3 bg-white text-[#242424] rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 text-left hover:bg-gray-50 transition-all"
              >
                <Search className="w-4 h-4 text-[#146C5A]" />
                <span>Search location, budget, or house type...</span>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className="py-3 px-6 bg-[#B66A32] hover:bg-[#a05b2a] text-white text-xs font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4 text-[#E8D8B9]" />
                Filter Houses
              </button>
            </div>
          </div>

          {/* Decorative background vectors */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#E8D8B9]/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Side Bento Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div 
            onClick={() => startNavigation()}
            className="p-5 bento-card-cream flex items-center gap-4 cursor-pointer hover:border-[#146C5A] transition-all group"
          >
            <div className="p-3 bg-[#146C5A] text-[#E8D8B9] rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-extrabold text-[#146C5A]">Built-in Live Navigation</h4>
                <span className="px-1.5 py-0.2 bg-[#146C5A] text-[#E8D8B9] text-[9px] font-bold rounded">NEW</span>
              </div>
              <p className="text-xs text-[#242424]/80 mt-0.5">Turn-by-turn voice prompts, live map & AI route assistant.</p>
            </div>
          </div>

          <div className="p-5 bento-card-accent flex items-center gap-4">
            <div className="p-3 bg-white/20 text-white rounded-2xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Direct Landlord Contacts</h4>
              <p className="text-xs text-white/90 mt-0.5">0% agent fees. Call or message verified property owners directly.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Category Pill Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold shrink-0 transition-all ${
              activeCategory === cat
                ? 'bg-[#146C5A] text-white shadow-md shadow-[#146C5A]/20'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* AI Smart Recommendations Section */}
      {recommendations.length > 0 && (
        <section className="space-y-4 bg-gradient-to-r from-[#146C5A]/5 via-[#B66A32]/5 to-[#146C5A]/5 p-6 rounded-3xl border border-[#146C5A]/20 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#146C5A] text-[#E8D8B9] rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#242424]">AI Curated for You</h2>
                <p className="text-[11px] text-gray-500">Personalized matches based on your activity, budget & preferred location</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('search')}
              className="text-xs font-bold text-[#146C5A] hover:underline flex items-center gap-1"
            >
              Explore More <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.slice(0, 3).map(rec => (
              <div key={rec.house.id} className="relative group">
                {/* AI Match Badge */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 bg-[#146C5A] text-[#E8D8B9] rounded-xl text-[10px] font-extrabold shadow-md">
                  <TrendingUp className="w-3 h-3 text-[#E8D8B9]" />
                  <span>{rec.matchScore}% Match</span>
                </div>

                <HouseCard house={rec.house} />

                {/* AI Reasoning Strip */}
                <div className="mt-2 p-2.5 bg-white border border-gray-200 rounded-2xl text-[11px] text-gray-700 font-medium flex items-center gap-2 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#B66A32] shrink-0" />
                  <span className="truncate">{rec.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GLOBAL ZERO-HOUSES EMPTY STATE OR REAL LISTINGS */}
      {!isLoading && houses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto my-6 shadow-xs">
          <div className="w-16 h-16 bg-[#146C5A]/10 text-[#146C5A] rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8 text-[#146C5A]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-[#242424]">
              No available houses at the moment
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
              No houses have been listed yet. Verified property listings published by landlords will automatically appear here once added. Please check back soon!
            </p>
          </div>

          {user?.role === 'landlord' ? (
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('add_house')}
                className="px-6 py-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-2xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <PlusSquare className="w-4 h-4 text-[#E8D8B9]" />
                List Your First Property Now
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsLoading(true);
                  api.getHouses()
                    .then(res => setHouses(res))
                    .catch(() => {})
                    .finally(() => setIsLoading(false));
                }}
                className="px-5 py-2.5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#E8D8B9]" />
                Refresh Listings
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Recently Added & Featured Section */}
          {featuredHouses.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#B66A32]" />
                  <h2 className="text-lg font-extrabold text-[#242424]">Featured & Recommended</h2>
                </div>
                <button
                  onClick={() => setActiveTab('search')}
                  className="text-xs font-bold text-[#146C5A] hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredHouses.slice(0, 3).map(house => (
                  <HouseCard key={house.id} house={house} />
                ))}
              </div>
            </section>
          )}

          {/* Interactive Map Explorer Section */}
          {availableHouses.length > 0 && (
            <section className="space-y-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-[#242424] flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#146C5A]" /> Map Explorer
                  </h2>
                  <p className="text-xs text-gray-500">Explore houses geographically with exact GPS pin locations.</p>
                </div>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 bg-[#146C5A]/10 text-[#146C5A] text-xs font-bold rounded-xl hover:bg-[#146C5A]/20 transition-colors"
                >
                  Open Fullscreen Search
                </button>
              </div>

              <MapViewer houses={availableHouses} onHouseClick={openHouseDetails} height="320px" />
            </section>
          )}

          {/* Available Rental Listings Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#242424]">
                {activeCategory === 'All' ? 'All Available Houses' : `${activeCategory} Listings`}
              </h2>
              <span className="text-xs text-gray-500 font-semibold">{filteredHouses.length} houses found</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : filteredHouses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
                <p className="text-sm font-bold text-gray-600">No available houses matched this category.</p>
                <button
                  onClick={() => setActiveCategory('All')}
                  className="mt-3 px-4 py-2 bg-[#146C5A] text-white text-xs font-bold rounded-xl"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredHouses.map(house => (
                  <HouseCard key={house.id} house={house} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
};

// Reusable House Card Component
export const HouseCard: React.FC<{ house: House }> = ({ house }) => {
  const { openHouseDetails, isHouseSaved, toggleSaveHouse } = usePlatform();
  const saved = isHouseSaved(house.id);

  return (
    <div className="bento-card overflow-hidden flex flex-col group hover:border-[#146C5A]/40 transition-all duration-300">
      
      {/* Cover Image Header */}
      <div className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => openHouseDetails(house)}>
        <img
          src={house.photos[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'}
          alt={house.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase backdrop-blur-md shadow-xs ${
            house.isAvailable ? 'bg-[#2E8B57] text-white' : 'bg-[#C13F4A] text-white'
          }`}>
            {house.isAvailable ? 'Available' : 'Occupied'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 text-[#146C5A] backdrop-blur-md">
            {house.houseType}
          </span>
        </div>

        {/* Save Bookmark Button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleSaveHouse(house.id); }}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all ${
            saved
              ? 'bg-[#146C5A] text-white shadow-md'
              : 'bg-white/80 text-gray-700 hover:bg-white'
          }`}
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>

        {/* Rent Tag */}
        <div className="absolute bottom-3 left-3 bg-[#146C5A] text-white px-3 py-1 rounded-xl text-xs font-extrabold shadow-md border border-[#E8D8B9]/30">
          KES {house.rent.toLocaleString()}<span className="text-[10px] font-normal opacity-80">/mo</span>
        </div>
      </div>

      {/* Body Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="cursor-pointer" onClick={() => openHouseDetails(house)}>
          <h3 className="text-sm font-extrabold text-[#242424] line-clamp-1 group-hover:text-[#146C5A] transition-colors">
            {house.title}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#B66A32] shrink-0" />
            {house.location.address}, {house.location.city}
          </p>
        </div>

        {/* Specs */}
        <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold">
              <Bed className="w-3.5 h-3.5 text-[#146C5A]" /> {house.bedrooms} {house.bedrooms === 1 ? 'Bed' : 'Beds'}
            </span>
            <span className="flex items-center gap-1 font-bold">
              <Bath className="w-3.5 h-3.5 text-[#146C5A]" /> {house.bathrooms} {house.bathrooms === 1 ? 'Bath' : 'Baths'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-gray-400">
            Dep: KES {house.deposit.toLocaleString()}
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => openHouseDetails(house)}
          className="w-full py-2.5 px-4 bg-[#F8F9FA] hover:bg-[#146C5A] hover:text-white text-[#146C5A] font-bold text-xs rounded-xl border border-gray-200 hover:border-[#146C5A] transition-all flex items-center justify-center gap-1.5"
        >
          View Listing Details
        </button>
      </div>

    </div>
  );
};
