import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Clean, lightweight page transition wrapper.
 * Provides a subtle 0.2s fade-in on navigation without blocking mounts,
 * delaying renders, or causing blank screen flickers.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition w-full">
      {children}
    </div>
  );
};

export default PageTransition;