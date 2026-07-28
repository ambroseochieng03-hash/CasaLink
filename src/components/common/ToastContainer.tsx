import React from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = usePlatform();

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-white/95 border-[#2E8B57]/30 text-[#242424]'
                : toast.type === 'error'
                ? 'bg-white/95 border-[#C13F4A]/30 text-[#242424]'
                : 'bg-white/95 border-[#146C5A]/30 text-[#242424]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#2E8B57]" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-[#C13F4A]" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-[#146C5A]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#242424]">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-[#242424]/80 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
