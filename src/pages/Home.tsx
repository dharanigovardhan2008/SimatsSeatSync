// Home/Landing Page
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';

export const Home: React.FC = () => {
  const { user, userData } = useAuth();

  return (
    <div className="min-h-screen bg-[#E0E5EC]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative px-4 py-32 md:py-48 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] opacity-50 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full bg-[#E0E5EC] shadow-[inset_6px_6px_10px_rgb(163,177,198,0.6),inset_-6px_-6px_10px_rgba(255,255,255,0.5)] opacity-50 animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] shadow-[12px_12px_20px_rgb(163,177,198,0.7),-12px_-12px_20px_rgba(255,255,255,0.6)] mb-8">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl text-[#3D4852] tracking-tight mb-6">
            SIMATS Seat<span className="text-[#6C63FF]">Sync</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#6B7280] max-w-2xl mx-auto mb-4">
            SIMATS Workshop & Seminar Management System
          </p>
          
          <p className="text-lg text-[#6B7280] max-w-xl mx-auto mb-10">
            Seamlessly register for workshops and seminars with real-time seat availability.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user && userData ? (
              <Link to={userData.role === 'admin' ? '/admin' : '/student'}>
                <Button variant="primary" size="lg">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#A3B1C6]/20">
        <div className="max-w-7xl mx-auto text-center text-[#6B7280]">
          <p>© 2024 SIMATS SeatSync – Workshop & Seminar Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
