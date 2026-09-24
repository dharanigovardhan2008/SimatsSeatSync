import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Extend the window object to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already installed or running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Has the user previously dismissed the prompt?
    const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Update UI to notify the user they can add to home screen
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-safe sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[100] max-w-sm mx-auto sm:mx-0">
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-4 flex items-start gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <div className="shrink-0">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <img src="/seatsync.png" alt="Seat Sync" className="w-8 h-8 object-contain" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-bold text-gray-900 leading-none mb-1">Install Seat Sync</h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">Add to home screen for quick access and offline tickets.</p>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleInstallClick} className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700">
              <Download size={14} className="mr-1.5" />
              Install
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss} className="h-8 w-8 p-0 shrink-0 border-gray-200">
              <X size={14} className="text-gray-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

