import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { subscribeToNotifications, markNotificationRead, markAllNotificationsRead, type AppNotification } from '@/lib/firebase';
import { Bell } from 'lucide-react';

const timeAgo = (ts?: { toMillis?: () => number }): string => {
  if (!ts?.toMillis) return '';
  const diffMs = Date.now() - ts.toMillis();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = async (n: AppNotification) => {
    if (!n.read) await markNotificationRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#1D1D1F] border border-white/80 shadow-sm hover:bg-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-white rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.15)] border border-black/5 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <p className="font-bold text-[14px] text-[#1D1D1F]">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => user && markAllNotificationsRead(user.uid)}
                className="text-[12px] font-semibold text-[#6C63FF] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-center text-[13px] text-[#86868B] py-8 px-4">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-black/5 transition-colors ${!n.read ? 'bg-[#6C63FF]/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#6C63FF] mt-1.5 shrink-0" />}
                    <div className={!n.read ? '' : 'pl-4'}>
                      <p className="text-[13px] font-bold text-[#1D1D1F]">{n.title}</p>
                      <p className="text-[12px] text-[#5E6C84] mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-[#A0AEC0] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
