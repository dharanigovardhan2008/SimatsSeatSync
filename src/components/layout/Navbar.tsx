// Navigation Bar Component
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

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
    <nav className="sticky top-0 z-50 px-6 py-4 bg-[#E0E5EC]/90 backdrop-blur-md shadow-[0_4px_16px_rgb(163,177,198,0.4)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-[#3D4852]">SIMATS SeatSync</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {user && userData && (
              <>
                {userData.role === 'student' && (
                  <Link
                    to="/student"
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      isActive('/student')
                        ? 'text-[#6C63FF] bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
                        : 'text-[#6B7280] hover:text-[#3D4852]'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
                {userData.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        isActive('/admin')
                          ? 'text-[#6C63FF] bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
                          : 'text-[#6B7280] hover:text-[#3D4852]'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/events"
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        isActive('/admin/events')
                          ? 'text-[#6C63FF] bg-[#E0E5EC] shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)]'
                          : 'text-[#6B7280] hover:text-[#3D4852]'
                      }`}
                    >
                      Workshops
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-4">
            {user && userData ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center text-white font-bold shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)]">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-[#3D4852]">{userData.name}</p>
                    <p className="text-[#6B7280] capitalize">{userData.role}</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-12 h-12 rounded-2xl bg-[#E0E5EC] flex items-center justify-center shadow-[5px_5px_10px_rgb(163,177,198,0.6),-5px_-5px_10px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#E0E5EC]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6 text-[#3D4852]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-[#3D4852]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 p-6 rounded-[24px] bg-[#E0E5EC] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]">
            <div className="flex flex-col gap-4">
              {user && userData ? (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b border-[#A3B1C6]/30">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B84FF] flex items-center justify-center text-white font-bold">
                      {userData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-[#3D4852]">{userData.name}</p>
                      <p className="text-sm text-[#6B7280] capitalize">{userData.role}</p>
                    </div>
                  </div>
                  
                  {userData.role === 'student' && (
                    <Link
                      to="/student"
                      className="px-4 py-3 rounded-xl font-medium text-[#3D4852] hover:bg-[#E0E5EC] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  
                  {userData.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className="px-4 py-3 rounded-xl font-medium text-[#3D4852] hover:bg-[#E0E5EC] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/events"
                        className="px-4 py-3 rounded-xl font-medium text-[#3D4852] hover:bg-[#E0E5EC] hover:shadow-[inset_3px_3px_6px_rgb(163,177,198,0.6),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] transition-all"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Workshops
                      </Link>
                    </>
                  )}
                  
                  <Button variant="secondary" onClick={handleLogout} className="mt-2">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
