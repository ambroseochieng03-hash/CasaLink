import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { api } from '../../services/api';
import { Logo } from '../common/Logo';
import { 
  X, 
  Mail, 
  Lock, 
  Phone, 
  User as UserIcon, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound,
  Building,
  UserCheck,
  Camera,
  Trash2,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const { isAuthModalOpen, setIsAuthModalOpen, authModalInitialTab, showToast } = usePlatform();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const regFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveTab(authModalInitialTab);
      setError(null);
      setFieldErrors({});
      setForgotMessage(null);
    }
  }, [isAuthModalOpen, authModalInitialTab]);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setForgotMessage(res.message || 'If an account exists for this email address, you will receive password reset instructions shortly.');
      showToast('Reset Request Submitted', 'If an account exists, instructions have been dispatched.', 'info');
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('valid email')) {
        setError(err.message);
      } else {
        setForgotMessage('If an account exists for this email address, you will receive password reset instructions shortly.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const handleRegFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        showToast('Photo Uploaded', 'Profile photo preview updated.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email.trim()) errors.loginEmail = 'Email address is required.';
    if (!password) errors.loginPassword = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      const u = await login(email, password);
      showToast('Welcome back!', `Logged in as ${u.fullName} (${u.role}).`, 'success');
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required.';
    } else if (!/^[0-9+-\s()]{8,18}$/.test(phoneNumber.trim().replace(/\s/g, ''))) {
      errors.phoneNumber = 'Invalid phone number format.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 4) {
      errors.password = 'Password must be at least 4 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Please correct the highlighted fields before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        confirmPassword,
        role,
        avatarUrl: avatarUrl || undefined,
      });

      showToast('Registration Successful!', `Created account for ${newUser.fullName}.`, 'success');
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E8D8B9] my-8"
        >
          {/* Header */}
          <div className="bg-[#146C5A] text-white p-6 relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <Logo size="md" className="mb-2" />
            <p className="text-xs text-[#E8D8B9] mt-1 font-medium">
              Direct connection between verified landlords & tenants without fees.
            </p>

            {/* Sub-navigation tabs */}
            <div className="flex bg-white/10 p-1 rounded-xl mt-4 border border-white/10">
              <button
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'login' ? 'bg-white text-[#146C5A] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'register' ? 'bg-white text-[#146C5A] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-[#C13F4A]">
                {error}
              </div>
            )}

            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. grace@casalink.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-[#146C5A] focus:ring-[#146C5A]"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-[#B66A32] font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Signing In...' : 'Sign In to CasaLink'}
                  <ArrowRight className="w-4 h-4 text-[#E8D8B9]" />
                </button>

                {/* Quick Credentials Helper */}
                <div className="p-3 bg-[#E8D8B9]/20 border border-[#B66A32]/20 rounded-xl space-y-1 text-[11px] text-gray-700">
                  <span className="font-bold text-[#B66A32]">Demo Accounts:</span>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    <button type="button" onClick={() => { setEmail('grace@casalink.com'); setPassword('demo'); }} className="underline hover:text-[#146C5A]">Tenant (grace@casalink.com)</button>
                    <button type="button" onClick={() => { setEmail('kamau@casalink.com'); setPassword('demo'); }} className="underline hover:text-[#146C5A]">Landlord (kamau@casalink.com)</button>
                    <button type="button" onClick={() => { setEmail('admin@casalink.com'); setPassword('demo'); }} className="underline hover:text-[#146C5A]">Admin (admin@casalink.com)</button>
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                
                {/* Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Register As</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('tenant')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                        role === 'tenant'
                          ? 'bg-[#146C5A] text-white border-[#146C5A] shadow-xs'
                          : 'bg-[#F8F9FA] text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <UserCheck className={`w-5 h-5 ${role === 'tenant' ? 'text-[#E8D8B9]' : 'text-[#146C5A]'}`} />
                      Tenant
                      <span className="text-[10px] font-normal opacity-80">Looking for rental house</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('landlord')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                        role === 'landlord'
                          ? 'bg-[#146C5A] text-white border-[#146C5A] shadow-xs'
                          : 'bg-[#F8F9FA] text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Building className={`w-5 h-5 ${role === 'landlord' ? 'text-[#E8D8B9]' : 'text-[#146C5A]'}`} />
                      Landlord
                      <span className="text-[10px] font-normal opacity-80">List rental properties</span>
                    </button>
                  </div>
                </div>

                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Profile Photo (Optional)</label>
                  <div className="flex items-center gap-3 bg-[#F8F9FA] p-2.5 rounded-2xl border border-gray-200">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-[#146C5A] shrink-0 bg-gray-100 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        ref={regFileInputRef}
                        onChange={handleRegFileChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => regFileInputRef.current?.click()}
                          className="px-3 py-1 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-all"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#E8D8B9]" />
                          {avatarUrl ? 'Replace Photo' : 'Upload Photo'}
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="px-2 py-1 bg-red-50 hover:bg-red-100 text-[#C13F4A] border border-red-200 font-bold text-xs rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 truncate">Select from device gallery. Preview shown.</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="e.g. Grace Ochieng"
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border ${
                        fieldErrors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.fullName}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="e.g. grace@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border ${
                        fieldErrors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.email}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={e => {
                        setPhoneNumber(e.target.value);
                        if (fieldErrors.phoneNumber) setFieldErrors(prev => ({ ...prev, phoneNumber: '' }));
                      }}
                      placeholder="e.g. 0748671072 or +254748671072"
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border ${
                        fieldErrors.phoneNumber ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
                    />
                  </div>
                  {fieldErrors.phoneNumber ? (
                    <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.phoneNumber}</span>
                  ) : (
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Format: 0748671072 or +254748671072</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2.5 bg-[#F8F9FA] border ${
                        fieldErrors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
                    />
                    {fieldErrors.password && (
                      <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.password}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2.5 bg-[#F8F9FA] border ${
                        fieldErrors.confirmPassword ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      } rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none`}
                    />
                    {fieldErrors.confirmPassword && (
                      <span className="text-[10px] text-red-600 font-bold mt-0.5 block">{fieldErrors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {isLoading ? 'Creating Account...' : `Register as ${role === 'landlord' ? 'Landlord' : 'Tenant'}`}
                </button>
              </form>
            )}

            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Enter your registered email address below and we will send you password reset instructions.
                </p>

                {forgotMessage ? (
                  <div className="p-4 bg-[#146C5A]/10 border border-[#146C5A]/30 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[#146C5A] font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#146C5A] shrink-0" />
                      Request Received
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      {forgotMessage}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="e.g. grace@casalink.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-300 rounded-xl text-xs text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Send Reset Link'}
                      <ArrowRight className="w-4 h-4 text-[#E8D8B9]" />
                    </button>
                  </>
                )}

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setError(null);
                      setForgotMessage(null);
                    }}
                    className="text-xs font-bold text-[#146C5A] hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
