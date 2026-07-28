import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Smartphone, 
  Download, 
  X, 
  QrCode, 
  Share, 
  CheckCircle2, 
  Sparkles, 
  Apple, 
  ShieldCheck,
  Info,
  Copy,
  Check,
  Monitor
} from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const { setDeviceView, deviceView } = usePlatform();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'native' | 'qr' | 'guide'>('native');

  // Detect current URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://casalink.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`;

  useEffect(() => {
    // Detect if user is on mobile
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileCheck = /android|ipad|iphone|ipod/i.test(userAgent);
      setIsMobile(mobileCheck);
      if (mobileCheck) {
        setActiveTab('install');
      } else {
        setActiveTab('qr');
      }
    }

    // Listen for PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already running in standalone/PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Switch to phone guide tab
      setActiveTab('guide');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8D8B9] z-10 my-auto"
        >
          {/* Top Header */}
          <div className="bg-gradient-to-r from-[#146C5A] via-[#0E5244] to-[#146C5A] p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xs">
                <Smartphone className="w-6 h-6 text-[#E8D8B9]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E8D8B9] bg-white/10 px-2 py-0.5 rounded-full">
                  Official CasaLink App
                </span>
                <h2 className="text-xl font-extrabold text-white">How to Install on Your Phone</h2>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
              Follow these simple steps to put the CasaLink app icon directly on your phone's home screen!
            </p>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-black/20 p-1 rounded-2xl mt-4 border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('native')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'native' ? 'bg-white text-[#146C5A] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Native Android
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'qr' ? 'bg-white text-[#146C5A] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Phone Link
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'guide' ? 'bg-white text-[#146C5A] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                Home Screen
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {activeTab === 'native' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-[#146C5A]">
                    <CheckCircle2 className="w-5 h-5 text-[#146C5A]" />
                    Complete Native Android Studio Project Generated!
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    CasaLink is now fully configured as a <b>standalone native Android application project</b> under <code>/android</code> in your workspace directory.
                  </p>
                </div>

                <div className="p-4 bg-[#FDFBF7] border border-[#E8D8B9] rounded-2xl space-y-3 text-xs">
                  <p className="font-bold text-[#146C5A] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#B66A32]" />
                    Included Android Native Specs:
                  </p>
                  <ul className="space-y-1.5 text-gray-700 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#146C5A] font-bold">•</span>
                      <span><b>Package ID:</b> <code>com.casalink.app</code></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#146C5A] font-bold">•</span>
                      <span><b>Kotlin & AndroidX Material 3</b> architecture</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#146C5A] font-bold">•</span>
                      <span><b>Gradle Wrapper & Build Configs</b> (SDK 34/35 compatible)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#146C5A] font-bold">•</span>
                      <span><b>Native App Permissions:</b> Location (GPS), Camera, Media Storage, Notifications & Calling</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#146C5A] font-bold">•</span>
                      <span><b>Adaptive Launcher Icons</b> & Native Android Animated Splash Screen</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#146C5A] font-bold">•</span>
                      <span><b>Signed Release APK & AAB</b> target configuration ready for Google Play Store</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-[#146C5A]/10 border border-[#146C5A]/30 rounded-2xl text-xs space-y-1.5">
                  <p className="font-extrabold text-[#146C5A] flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-[#B66A32]" />
                    Command Line Build Quick Guide:
                  </p>
                  <div className="bg-gray-900 text-emerald-300 p-2.5 rounded-xl font-mono text-[10px] space-y-1 overflow-x-auto">
                    <p className="text-gray-400"># Open /android folder in Android Studio or run:</p>
                    <p>cd android</p>
                    <p>./gradlew assembleRelease  <span className="text-gray-400"># Builds APK</span></p>
                    <p>./gradlew bundleRelease    <span className="text-gray-400"># Builds Play Store .aab</span></p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDeviceView(deviceView === 'android' ? 'web' : 'android');
                    onClose();
                  }}
                  className="w-full py-3 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#E8D8B9]" />
                  <span>Preview CasaLink in Interactive Android Device Mode</span>
                </button>
              </div>
            )}
            {activeTab === 'qr' && (
              <div className="text-center space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-amber-950">
                    <Smartphone className="w-4 h-4 text-[#B66A32]" /> Step 1: Open link on your phone
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    To get the app icon on your phone's home screen, open this web link directly in your mobile phone browser (Chrome or Safari).
                  </p>
                </div>

                <div className="p-4 bg-white border-2 border-dashed border-[#146C5A]/30 rounded-3xl inline-block shadow-xs">
                  <img
                    src={qrCodeUrl}
                    alt="Scan CasaLink QR Code"
                    className="w-48 h-48 mx-auto rounded-xl shadow-xs"
                  />
                  <p className="text-xs font-bold text-[#146C5A] mt-2.5 flex items-center justify-center gap-1">
                    <QrCode className="w-4 h-4 text-[#B66A32]" /> Scan with Phone Camera
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold">Or copy link & send to your phone:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 bg-[#146C5A] hover:bg-[#0E5244] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('guide')}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  See How to Add to Home Screen <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {activeTab === 'install' && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-[#FDFBF7] border border-[#E8D8B9]/80 rounded-2xl space-y-2 text-left text-xs">
                  <div className="flex items-center gap-2 text-[#146C5A] font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-[#B66A32]" />
                    CasaLink App Features
                  </div>
                  <ul className="space-y-1.5 text-gray-700 pt-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#146C5A]" /> Instant direct landlord contact
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#146C5A]" /> Turn-by-turn house GPS navigation
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#146C5A]" /> Zero commission fees
                    </li>
                  </ul>
                </div>

                {deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-6 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#146C5A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-[#E8D8B9]" />
                    <span>Tap Here to Install App</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('guide')}
                    className="w-full py-3.5 px-6 bg-[#146C5A] hover:bg-[#0E5244] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#146C5A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Info className="w-5 h-5 text-[#E8D8B9]" />
                    <span>View Phone Installation Steps</span>
                  </button>
                )}
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#146C5A]" /> Step 2: Add to your phone screen
                  </p>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    Once you open the link on your phone, follow these browser steps to add the app icon:
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Android Chrome */}
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5">
                    <p className="font-extrabold text-amber-950 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#B66A32]" />
                      Android Phones (Chrome / Edge / Firefox):
                    </p>
                    <ol className="list-decimal list-inside text-amber-900 space-y-1 leading-relaxed pl-1 text-[11px]">
                      <li>Open this website in Chrome on your Android phone.</li>
                      <li>Tap the 3 dots menu icon <b>(⋮)</b> at the top right.</li>
                      <li>Tap <b>"Install App"</b> or <b>"Add to Home Screen"</b>.</li>
                      <li>CasaLink will appear on your phone's main home screen!</li>
                    </ol>
                  </div>

                  {/* iPhone Safari */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-slate-800" />
                      iPhones / iPads (Safari Browser):
                    </p>
                    <ol className="list-decimal list-inside text-slate-800 space-y-1 leading-relaxed pl-1 text-[11px]">
                      <li>Open this website in Safari on your iPhone.</li>
                      <li>Tap the <b>Share button</b> (box with arrow <Share className="w-3 h-3 inline text-blue-600" />) at the bottom.</li>
                      <li>Scroll down and tap <b>"Add to Home Screen"</b>.</li>
                      <li>Tap <b>Add</b> in the top right corner.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setDeviceView(deviceView === 'android' ? 'web' : 'android');
                onClose();
              }}
              className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-[#146C5A] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-[#E8D8B9] cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#B66A32]" />
              <span>{deviceView === 'android' ? 'Switch to Web' : 'Live Android Mode'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors px-2 py-1"
              >
                Close
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#146C5A] text-white text-xs font-bold rounded-xl hover:bg-[#0E5244] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link Copied!' : 'Copy App Link'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

