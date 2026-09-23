/**
 * Mobile-safe background wrapper for CloudShader.
 * Prevents flickering/repainting issues on mobile by:
 * - Using a static container architecture
 * - Avoiding fixed positioning that triggers mobile repaints
 * - Providing a fallback gradient on low-performance devices
 */

import React, { useState, useEffect } from 'react';
import { CloudShader } from './cloud-shader';

interface CloudBackgroundProps {
  speed?: number;
  count?: number;
  cloudColor?: string;
  skyTopColor?: string;
  skyBottomColor?: string;
}

export const CloudBackground: React.FC<CloudBackgroundProps> = ({
  speed = 0.8,
  count = 6,
  cloudColor = "#fbf8f2",
  skyTopColor = "#3876ba",
  skyBottomColor = "#8cbfe8",
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile/tablet devices
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const tablet = window.innerWidth <= 1024;
      setIsMobile(mobile || tablet);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check for low-performance indicators
    const checkPerformance = () => {
      // If device has low memory or is running slowly, use fallback
      if ('deviceMemory' in navigator && (navigator as any).deviceMemory < 4) {
        setUseFallback(true);
      }
      // Check if reduced motion is preferred
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setUseFallback(true);
      }
    };

    checkPerformance();

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fallback gradient background for mobile or low-performance devices
  if (useFallback || (isMobile && count > 4)) {
    return (
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(to bottom, ${skyTopColor} 0%, ${skyBottomColor} 100%)`,
        }}
      />
    );
  }

  // Mobile optimization: reduce cloud count and animation speed
  const mobileCount = isMobile ? Math.min(count, 4) : count;
  const mobileSpeed = isMobile ? speed * 0.7 : speed;

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Static container to prevent mobile repaint issues */}
      <div className="absolute inset-0 w-full h-full">
        <CloudShader
          speed={mobileSpeed}
          count={mobileCount}
          cloudColor={cloudColor}
          skyTopColor={skyTopColor}
          skyBottomColor={skyBottomColor}
        />
      </div>
    </div>
  );
};

export default CloudBackground;
