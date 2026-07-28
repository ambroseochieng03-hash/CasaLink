import React, { useState, useEffect } from 'react';
import { House } from '../../types';
import { api } from '../../services/api';
import { usePlatform } from '../../context/PlatformContext';
import { HouseCard } from './HomeFeed';
import { MapViewer } from '../common/MapViewer';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Grid, 
  Map, 
  X, 
  RotateCcw,
  Check
} from 'lucide-react';

export const SearchHousesView: React.FC = () => {
  const { searchFilters, setSearchFilters, openHouseDetails } = usePlatform();
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'grid' | 'map'>('grid');

  const houseTypes = ['All', 'Apartment', 'Bungalow', 'Mansionette', 'Studio', 'Single Room', 'Villa', 'Townhouse'];
  const bedroomOptions = ['Any', '1', '2', '3', '4+'];
  const availableAmenities = ['Borehole Water', 'Backup Generator', 'CCTV Security', 'Parking', 'WiFi Ready', 'Solar Water Heater', 'Balcony', 'Private Garden', 'Pet Friendly'];

  useEffect(() => {
    fetchFilteredHouses();
  }, [searchFilters]);

  const fetchFilteredHouses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getHouses(searchFilters);
      setHouses(res);
    } catch (e) {
      // handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setSearchFilters(prev => {
      const exists = prev.amenities.includes(amenity);
      const updated = exists ? prev.amenities.filter(a => a !== amenity) : [...prev.amenities, amenity];
      return { ...prev, amenities: updated };
    });
  };

  const handleResetFilters = () => {
    setSearchFilters({
      keyword: '',
      location: '',
      minRent: 0,
      maxRent: 200000,
      houseType: 'All',
      bedrooms: 'Any',
      amenities: [],
      availabilityOnly: true,
      sortBy: 'newest',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Search Header Bar */}
      <div className="bento-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#242424]">Search & Filter Rental Houses</h1>
            <p className="text-xs text-gray-500">Filter by exact location, budget range, house type, and amenities.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#F8F9FA] p-1 rounded-2xl border border-gray-200 flex items-center">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  displayMode === 'grid' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600 hover:text-[#146C5A]'
                }`}
              >
                <Grid className="w-4 h-4" /> Grid View
              </button>
              <button
                onClick={() => setDisplayMode('map')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  displayMode === 'map' ? 'bg-[#146C5A] text-white shadow-xs' : 'text-gray-600 hover:text-[#146C5A]'
                }`}
              >
                <Map className="w-4 h-4" /> Map View
              </button>
            </div>

            <button
              onClick={handleResetFilters}
              className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Reset Search Filters"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Keyword search */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilters.keyword}
                onChange={e => setSearchFilters(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="e.g. Kilimani, Westlands, Balcony..."
                className="w-full pl-10 pr-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">City / County</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilters.location}
                onChange={e => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Nairobi, Mombasa, Nakuru"
                className="w-full pl-10 pr-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
              />
            </div>
          </div>

          {/* House Type Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">House Type</label>
            <select
              value={searchFilters.houseType}
              onChange={e => setSearchFilters(prev => ({ ...prev, houseType: e.target.value }))}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none font-medium"
            >
              {houseTypes.map(ht => (
                <option key={ht} value={ht}>{ht}</option>
              ))}
            </select>
          </div>

          {/* Bedrooms Selector */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Bedrooms</label>
            <select
              value={searchFilters.bedrooms}
              onChange={e => setSearchFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none font-medium"
            >
              {bedroomOptions.map(b => (
                <option key={b} value={b}>{b === 'Any' ? 'Any Bedrooms' : `${b} Bedroom(s)`}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Budget Range & Sorting Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          
          <div className="sm:col-span-2 space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-700">
              <span>Max Rent Budget: KES {searchFilters.maxRent.toLocaleString()}/mo</span>
              <span>KES 200,000</span>
            </div>
            <input
              type="range"
              min={5000}
              max={200000}
              step={2500}
              value={searchFilters.maxRent}
              onChange={e => setSearchFilters(prev => ({ ...prev, maxRent: Number(e.target.value) }))}
              className="w-full accent-[#146C5A] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Sort Results By</label>
            <select
              value={searchFilters.sortBy}
              onChange={e => setSearchFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none font-medium"
            >
              <option value="newest">Newest Listed First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>

        </div>

        {/* Amenities Pill Checkbox Selection */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase block">Required Amenities</span>
          <div className="flex flex-wrap gap-2">
            {availableAmenities.map(am => {
              const selected = searchFilters.amenities.includes(am);
              return (
                <button
                  key={am}
                  type="button"
                  onClick={() => handleAmenityToggle(am)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selected
                      ? 'bg-[#146C5A] text-white border border-[#146C5A]'
                      : 'bg-[#F8F9FA] text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-[#E8D8B9]" />}
                  {am}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Results View Area */}
      {displayMode === 'map' ? (
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
            <span>Displaying {houses.length} houses on Interactive Map</span>
            <span>Click any marker pin to preview house details</span>
          </div>
          <MapViewer houses={houses} onHouseClick={openHouseDetails} height="520px" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#242424] uppercase tracking-wider">
              Matching Search Results ({houses.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : houses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-3">
              <p className="text-sm font-extrabold text-gray-700">No available houses found.</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">No houses match your current search filters or no properties have been published yet. Check back soon for new listings uploaded by verified landlords!</p>
              <button
                onClick={handleResetFilters}
                className="py-2.5 px-5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#E8D8B9]" />
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {houses.map(house => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
