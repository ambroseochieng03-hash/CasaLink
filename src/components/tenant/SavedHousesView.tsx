import React, { useState, useEffect } from 'react';
import { House } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { HouseCard } from './HomeFeed';
import { Bookmark, Sparkles } from 'lucide-react';

export const SavedHousesView: React.FC = () => {
  const { user } = useAuth();
  const { savedHouseIds, openAuthModal, setActiveTab } = usePlatform();
  const [savedHouses, setSavedHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    api.getSavedHouses(user.id)
      .then(res => setSavedHouses(res))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user, savedHouseIds]);

  if (!user) {
    return (
      <div className="py-16 text-center bento-card p-8 space-y-4 max-w-md mx-auto my-8">
        <Bookmark className="w-12 h-12 text-[#146C5A] mx-auto opacity-40" />
        <h2 className="text-lg font-extrabold text-[#242424]">Sign in to View Saved Houses</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Bookmark genuine rental listings while searching and access them anytime on desktop or mobile app.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-md"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bento-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#242424] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#146C5A]" /> Saved Houses Bookmarks
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            You have {savedHouses.length} bookmarked properties saved in your account.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : savedHouses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8 space-y-3">
          <Bookmark className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No saved houses yet.</p>
          <p className="text-xs text-gray-500">Tap the bookmark icon on any house card to save it here for quick access.</p>
          <button
            onClick={() => setActiveTab('home')}
            className="py-2.5 px-5 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Explore Available Listings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedHouses.map(house => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      )}
    </div>
  );
};
