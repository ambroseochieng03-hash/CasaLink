import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlatform } from '../../context/PlatformContext';
import { ShieldCheck, PhoneCall, KeyRound, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PhoneVerificationModal: React.FC = () => {
  const { user, verifyPhone } = useAuth();
  const { isPhoneVerifyModalOpen, setIsPhoneVerifyModalOpen, showToast } = usePlatform();
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentCode, setSentCode] = useState(false);

  if (!isPhoneVerifyModalOpen || !user) return null;

  const handleSendCode = async () => {
    setSentCode(true);
    showToast('Verification Code Sent', `An SMS OTP was sent to ${user.phoneNumber}. Use code 123456 to verify.`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      showToast('Enter Code', 'Please enter the 6-digit verification code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyPhone(otp.trim());
      showToast('Phone Verified!', 'Your landlord phone account is now verified. You can list properties.', 'success');
      setIsPhoneVerifyModalOpen(false);
      setOtp('');
      setSentCode(false);
    } catch (err: any) {
      showToast('Verification Failed', err.message || 'Invalid code. Use code 123456 for testing.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E8D8B9]"
        >
          {/* Header */}
          <div className="bg-[#146C5A] text-white p-6 relative">
            <button
              onClick={() => setIsPhoneVerifyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#E8D8B9]/20 text-[#E8D8B9] flex items-center justify-center mb-3 border border-[#E8D8B9]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Verify Landlord Phone</h3>
            <p className="text-xs text-[#E8D8B9] mt-1">
              Required before publishing property listings on CasaLink to prevent fake listings.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200 flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-[#146C5A] shrink-0" />
              <div>
                <span className="text-xs text-gray-500 block">Registered Phone</span>
                <span className="text-sm font-bold text-[#242424]">{user.phoneNumber}</span>
              </div>
            </div>

            {!sentCode ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  We will send a 6-digit SMS verification passcode to your phone number to ensure authenticity.
                </p>
                <button
                  onClick={handleSendCode}
                  className="w-full py-3 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#E8D8B9]" />
                  Send SMS Passcode
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-[#E8D8B9]/20 border border-[#B66A32]/30 rounded-xl text-xs text-[#242424]">
                  <span className="font-bold text-[#B66A32]">Demo Mode Active:</span> Enter code <code className="px-1.5 py-0.5 bg-white font-mono font-bold rounded border border-gray-300 text-[#146C5A]">123456</code> to verify instantly.
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    6-Digit Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-gray-300 rounded-xl font-mono text-lg tracking-widest text-center text-[#242424] focus:ring-2 focus:ring-[#146C5A] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Complete Phone Verification'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="text-xs text-[#B66A32] font-semibold hover:underline"
                  >
                    Resend SMS Code
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
