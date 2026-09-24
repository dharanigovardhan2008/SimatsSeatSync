import sys
content = open('src/components/layout/Navbar.tsx', 'r').read()

old_logo = """          {/* Premium Logo - No black circle, elegant glassmorphic container with teal/blue accent */}
            <Link to="/" className="flex items-center gap-2.5 group cursor-pointer select-none">
              <div className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_16px_rgba(0,100,200,0.08)] flex items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(108,99,255,0.2)] group-active:scale-95">
                <img
                  src="/seatsync.png"
                  alt="SeatSync Logo"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[18px] text-[#1D1D1F] tracking-tight group-hover:text-black transition-colors">
                  Seat<span className="bg-gradient-to-r from-[#3B9EFF] to-[#007AFF] bg-clip-text text-transparent">Sync</span>
                </span>
              </div>
            </Link>"""

new_logo = """          {/* Clean and minimal Seat Sync Logo */}
            <Link to="/" className="flex items-center cursor-pointer select-none transition-transform active:scale-95">
              <img
                src="/seatsync.png"
                alt="Seat Sync"
                className="h-9 sm:h-11 w-auto object-contain"
              />
            </Link>"""

content = content.replace(old_logo, new_logo)
open('src/components/layout/Navbar.tsx', 'w').write(content)

