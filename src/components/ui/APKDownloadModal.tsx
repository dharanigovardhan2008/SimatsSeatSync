/**
 * APK Download Modal
 * Shows on first visit or after login for new users.
 * Remembers dismissal via localStorage.
 * Ready to work once APK URL is provided via env variable.
 */

import React, { useEffect, useState } from 'react';
import { X, Download, Smartphone, CheckCircle } from 'lucide-react';

interface APKDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Configuration - set this via environment variable when APK is ready
const APK_DOWNLOAD_URL = import.meta.env.VITE_APK_DOWNLOAD_URL || '';
const APK_AVAILABLE = !!APK_DOWNLOAD_URL;

const STORAGE_KEY = 'seatsync-apk-download-dismissed';
const STORAGE_VERSION = 'v1'; // Increment this to re-show the popup after updates

export const APKDownloadModal: React.FC<APKDownloadModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (APK_AVAILABLE) {
      window.open(APK_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
      setDownloaded(true);
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, STORAGE_VERSION);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes checkmark {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(-45deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      `}</style>

      <div
        className="bg-white rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-md w-full p-8 relative animate-[slideUp_0.3s_cubic-bezier(0.2,0.9,0.3,1.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors group"
          aria-label="Close"
        >
          <X size={18} className="text-[#5E6C84] group-hover:text-[#1D1D1F]" strokeWidth={2.5} />
        </button>

        {/* Header with icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(59,158,255,0.3)]">
            <Smartphone size={36} className="text-white" strokeWidth={2} />
          </div>
          <h2 className="text-[24px] font-extrabold text-[#1D1D1F] tracking-tight mb-2">
            Get the Mobile App
          </h2>
          <p className="text-[15px] text-[#5E6C84] font-medium leading-relaxed">
            Download SeatSync for Android and manage your workshop registrations on the go.
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-3 mb-8">
          {[
            'Instant event notifications',
            'Quick QR code access',
            'Offline ticket viewing',
            'Faster performance',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#34C759]/10 flex items-center justify-center shrink-0">
                <CheckCircle size={14} className="text-[#34C759]" strokeWidth={3} />
              </div>
              <span className="text-[14px] text-[#1D1D1F] font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Download button */}
        {APK_AVAILABLE ? (
          <button
            onClick={handleDownload}
            disabled={downloaded}
            className={`w-full py-4 rounded-full font-bold text-[15px] transition-all shadow-lg flex items-center justify-center gap-2 ${
              downloaded
                ? 'bg-[#34C759] text-white'
                : 'bg-[#1D1D1F] hover:bg-black text-white active:scale-95'
            }`}
          >
            {downloaded ? (
              <>
                <CheckCircle size={20} className="animate-[checkmark_0.4s_cubic-bezier(0.2,0.9,0.3,1.1)]" />
                <span>Download Started</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>Download APK</span>
              </>
            )}
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <p className="text-[14px] text-amber-700 font-semibold mb-2">APK Coming Soon</p>
            <p className="text-[13px] text-amber-600">
              We're preparing the mobile app. Check back later!
            </p>
          </div>
        )}

        {/* Don't show again */}
        <button
          onClick={handleDismiss}
          className="w-full mt-4 py-3 text-[14px] font-semibold text-[#5E6C84] hover:text-[#1D1D1F] transition-colors"
        >
          Maybe Later
        </button>

        {/* Size info */}
        {APK_AVAILABLE && (
          <p className="text-center text-[12px] text-[#86868B] mt-4">
            APK size: ~15MB • Android 6.0+
          </p>
        )}
      </div>
    </div>
  );
};

// Hook to manage APK modal visibility
export const useAPKDownloadModal = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the modal before
    const dismissed = localStorage.getItem(STORAGE_KEY);

    // Show modal if not dismissed or if version has changed
    if (!dismissed || dismissed !== STORAGE_VERSION) {
      // Delay showing modal by 2 seconds after page load
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  return {
    showModal,
    setShowModal,
  };
};

export default APKDownloadModal;
