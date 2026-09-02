// Navigation Bar Component
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, userData, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 px-4 sm:px-6 py-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Completely rounded pill-shaped outer wrapper with Apple glassmorphism style */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_32px_rgba(0,100,200,0.06)] rounded-full px-5 py-2.5 flex items-center justify-between">
          
          {/* Logo with Custom Image Icon from /public/seatsync.png & Removed "SIMATS" */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#1D1D1F] flex items-center justify-center shadow-md overflow-hidden transition-transform group-active:scale-95 p-1.5">
              <img 
                src="/seatsync.png" 
                alt="SeatSync Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-bold text-[17px] text-[#1D1D1F] tracking-tight">Seat<span className="text-[#86868B]">Sync</span></span>
          </Link>

          {/* Desktop Navigation - Glassy Pill Bar */}
          <div className="hidden md:flex items-center gap-1 bg-white/50 backdrop-blur-md p-1 rounded-full border border-white/60 shadow-inner">
            {user && userData && (
              <>
                {userData.role === 'student' && (
                  <>
                    <Link
                      to="/student"
                      className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all duration-300 ${
                        isActive('/student')
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/student"
                      className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all duration-300 text-[#5E6C84] hover:text-[#1D1D1F]`}
                    >
                      Tickets
                    </Link>
                  </>
                )}
                {userData.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all duration-300 ${
                        isActive('/admin')
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/events"
                      className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all duration-300 ${
                        isActive('/admin/events')
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Workshops
                    </Link>
                  </>
                )}
                {userData.role === 'coordinator' && (
                  <Link
                    to="/coordinator"
                    className={`px-5 py-2 rounded-full text-[14px] font-semibold transition-all duration-300 ${
                      isActive('/coordinator')
                        ? 'bg-[#1D1D1F] text-white shadow-sm'
                        : 'text-[#5E6C84] hover:text-[#1D1D1F]'
                    }`}
                  >
                    My Events
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Section / Auth / Logout */}
          <div className="hidden md:flex items-center gap-2">
            {user && userData ? (
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl p-1 pl-4 rounded-full border border-white/80 shadow-sm">
                <div className="flex items-center gap-2 mr-1">
                  <div className="w-7 h-7 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] font-bold text-[#1D1D1F]">{userData.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 rounded-full bg-[#1D1D1F] text-white text-[13px] font-bold hover:bg-black transition-colors shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="px-5 py-2 rounded-full text-[14px] font-semibold text-[#1D1D1F] hover:bg-white/60 transition-colors">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-5 py-2 rounded-full text-[14px] font-semibold bg-[#1D1D1F] text-white hover:bg-black transition-all shadow-sm">
                    Register
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#1D1D1F] focus:outline-none border border-white/80 shadow-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 p-5 rounded-[32px] bg-white/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,100,200,0.12)] border border-white">
            <div className="flex flex-col gap-3">
              {user && userData ? (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100/80">
                    <div className="w-10 h-10 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {userData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-[#1D1D1F]">{userData.name}</p>
                      <p className="text-xs text-[#5E6C84] capitalize font-medium">{userData.role}</p>
                    </div>
                  </div>
                  
                  {userData.role === 'student' && (
                    <>
                      <Link
                        to="/student"
                        className="px-4 py-3 rounded-2xl font-semibold text-[15px] text-[#1D1D1F] bg-white/60 border border-white shadow-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard & Tickets
                      </Link>
                    </>
                  )}
                  
                  {userData.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className="px-4 py-3 rounded-2xl font-semibold text-[15px] text-[#1D1D1F] bg-white/60 border border-white shadow-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/events"
                        className="px-4 py-3 rounded-2xl font-semibold text-[15px] text-[#1D1D1F] bg-white/60 border border-white shadow-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Workshops
                      </Link>
                    </>
                  )}

                  {userData.role === 'coordinator' && (
                    <Link
                      to="/coordinator"
                      className="px-4 py-3 rounded-2xl font-semibold text-[15px] text-[#1D1D1F] bg-white/60 border border-white shadow-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Events
                    </Link>
                  )}
                  
                  <button onClick={handleLogout} className="w-full py-3.5 rounded-full font-semibold text-[15px] text-white bg-[#1D1D1F] text-center mt-1 shadow-md">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3.5 rounded-full font-semibold text-[15px] text-[#1D1D1F] bg-white/70 border border-white shadow-sm">Login</button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3.5 rounded-full font-semibold text-[15px] text-white bg-[#1D1D1F] shadow-md">Register</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;