// 404 Not Found Page Component
import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent text-[#1D1D1F] flex flex-col justify-between" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <div>
        <Navbar />

        <main className="max-w-[700px] mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#3B9EFF]/20 to-[#007AFF]/20 border border-[#3B9EFF]/30 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="text-4xl font-extrabold text-[#3B9EFF]">404</span>
          </div>

          <h1 className="font-extrabold text-[32px] sm:text-[44px] text-[#1D1D1F] tracking-tight leading-tight mb-4">
            Page Not Found
          </h1>

          <p className="text-[16px] text-[#5E6C84] font-medium leading-relaxed max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-extrabold text-[15px] transition-all shadow-md active:scale-95"
            >
              <Home size={18} />
              <span>Back to Home</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/80 hover:bg-white text-[#1D1D1F] font-extrabold text-[15px] transition-all border border-white shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </div>
        </main>
      </div>

      <footer className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 border-t border-white/40 mt-12 relative z-10 text-center text-[#5E6C84] text-[13px] font-medium">
        © {new Date().getFullYear()} SIMATS SeatSync. All rights reserved.
      </footer>
    </div>
  );
};

export default NotFound;
