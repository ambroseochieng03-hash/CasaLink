import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { api } from '../../services/api';
import { User, ShieldCheck, Phone, Mail, User as UserIcon, Edit3, Save, Sparkles, Camera, Trash2, Upload } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast, setIsPhoneVerifyModalOpen, openAuthModal } = usePlatform();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8 space-y-4 max-w-md mx-auto my-8">
        <UserIcon className="w-12 h-12 text-[#146C5A] mx-auto opacity-40" />
        <h2 className="text-lg font-extrabold text-[#242424]">Sign In to View Profile</h2>
        <button onClick={() => openAuthModal('login')} className="px-6 py-3 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-md">
          Sign In
        </button>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image smaller than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setAvatarUrl(evt.target.result as string);
        showToast('Photo Loaded', 'Preview updated. Save profile changes to apply.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || user.fullName)}`;
    setAvatarUrl(fallbackAvatar);
    showToast('Photo Removed', 'Reverted to default initial avatar.', 'info');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Phone Number is required.';
    } else if (!/^[0-9+-\s()]{8,18}$/.test(phoneNumber.trim().replace(/\s/g, ''))) {
      errors.phoneNumber = 'Invalid phone number format.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Validation Error', 'Please correct the highlighted fields.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateProfile({
        userId: user.id,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        avatarUrl,
      });
      updateUser(res.user);
      showToast('Profile Updated', 'Your user profile details have been saved.', 'success');
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('phone')) {
        setFieldErrors(prev => ({ ...prev, phoneNumber: e.message }));
      }
      showToast('Error', e.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Profile Card Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#146C5A] shrink-0 bg-gray-100 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-10 h-10 text-gray-400" />
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#242424] truncate">{user.fullName}</h1>
            {user.isPhoneVerified && (
              <span className="p-0.5 rounded-full bg-[#146C5A] text-white shrink-0" title="Verified Phone Number">
                <ShieldCheck className="w-4 h-4 text-[#E8D8B9]" />
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <span className="inline-block px-3 py-0.5 bg-[#146C5A]/10 text-[#146C5A] text-[11px] font-extrabold uppercase rounded-full">
            Role: {user.role}
          </span>
        </div>
      </div>

      {/* Phone Verification Status Box */}
      {user.role === 'landlord' && (
        <div className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${
          user.isPhoneVerified ? 'bg-[#2E8B57]/10 border-[#2E8B57]/30 text-[#2E8B57]' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div>
            <h4 className="text-xs font-bold uppercase">Landlord Phone Verification</h4>
            <p className="text-xs mt-0.5 opacity-90">
              {user.isPhoneVerified 
                ? 'Your phone number is verified. You can list up to 10 active properties.' 
                : 'Phone verification is required before you can list rental houses.'}
            </p>
          </div>
          {!user.isPhoneVerified && (
            <button
              onClick={() => setIsPhoneVerifyModalOpen(true)}
              className="py-2 px-4 bg-[#146C5A] text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
            >
              Verify Now
            </button>
          )}
        </div>
      )}

      {/* Edit Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-[#242424] uppercase tracking-wider">Edit Account Details</h3>

        {/* Profile Photo Upload / Replace / Remove */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Profile Photo</label>
          <div className="flex items-center gap-4 bg-[#F8F9FA] p-3 rounded-2xl border border-gray-200">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#146C5A] shrink-0 bg-gray-100 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-[#E8D8B9]" />
                  {avatarUrl ? 'Replace Photo' : 'Choose Photo'}
                </button>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#C13F4A] border border-red-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </button>
              </div>

              <span className="text-[11px] text-gray-500">Choose photo from device gallery. Preview updates immediately.</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
            }}
            className={`w-full px-4 py-2.5 bg-[#F8F9FA] border ${
              fieldErrors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
            } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
          />
          {fieldErrors.fullName && (
            <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.fullName}</span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            required
            value={phoneNumber}
            onChange={e => {
              setPhoneNumber(e.target.value);
              if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
            }}
            className={`w-full px-4 py-2.5 bg-[#F8F9FA] border ${
              fieldErrors.phoneNumber ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
            } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
          />
          {fieldErrors.phoneNumber && (
            <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.phoneNumber}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        >
          <Save className="w-4 h-4 text-[#E8D8B9]" />
          {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </form>

    </div>
  );
};
