import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { getUserRegistrations, getEventById } from '@/lib/firebase';
import { downloadCertificate } from '@/lib/certificate';
import type { DocumentData as FSDocumentData } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { Ticket as TicketIcon } from 'lucide-react';

interface TicketRow {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventImage?: string;
  participantName: string;
  teamName?: string;
  attended: boolean;
  hasCertificate: boolean;
  event: FSDocumentData;
}

const handleCertDownload = async (
  e: React.MouseEvent,
  t: TicketRow,
  setDownloadingId: (id: string | null) => void
) => {
  e.preventDefault(); // don't follow the card's own Link
  e.stopPropagation();
  setDownloadingId(t.registrationId);
  try {
    await downloadCertificate(t.event, t.participantName);
  } catch (err) {
    console.error('Could not generate certificate:', err);
    alert('Could not generate the certificate. Please try again or contact the event coordinator.');
  } finally {
    setDownloadingId(null);
  }
};

export const MyTickets: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !userData)) {
      navigate('/login');
    }
  }, [user, userData, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const regs = await getUserRegistrations(user.uid);
      const eventCache = new Map<string, DocumentData | null>();

      const rows: TicketRow[] = [];
      for (const reg of regs as DocumentData[]) {
        if (reg.status && reg.status !== 'confirmed') continue;
        if (!eventCache.has(reg.event_id)) {
          eventCache.set(reg.event_id, await getEventById(reg.event_id));
        }
        const ev = eventCache.get(reg.event_id);
        if (!ev) continue;
        rows.push({
          registrationId: reg.id,
          eventId: reg.event_id,
          eventTitle: ev.title,
          eventDate: ev.date,
          eventImage: ev.images?.[0],
          participantName: reg.participant_name || userData?.name || '',
          teamName: reg.team_name,
          attended: !!reg.attended,
          hasCertificate: !!ev.certificate_template_url,
          event: ev,
        });
      }
      rows.sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));
      setTickets(rows);
      setLoading(false);
    })();
  }, [user, userData]);

  if (authLoading || loading) {
    return <LoadingScreen message="Loading your tickets..." />;
  }

  return (
    <div className="min-h-screen bg-transparent text-[#1D1D1F] pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
        <h1 className="font-extrabold text-[28px] sm:text-[32px] tracking-tight mb-2">My Tickets</h1>
        <p className="text-[#5E6C84] text-[14px] sm:text-[15px] font-medium mb-8">
          Every ticket booked under your account — including teammates you registered.
        </p>

        {tickets.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-16 text-center border border-white/90 shadow-[0_8px_30px_rgba(0,100,200,0.06)]">
            <TicketIcon className="mx-auto mb-4 text-[#86868B]" size={32} />
            <p className="text-[#5E6C84] font-semibold text-[15px]">You don't have any tickets yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((t) => (
              <Link
                key={t.registrationId}
                to={`/ticket/${t.registrationId}`}
                className="block bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 shadow-[0_12px_40px_rgba(0,100,200,0.08)] hover:shadow-[0_18px_50px_rgba(0,100,200,0.12)] transition-all border border-white group"
              >
                {t.eventImage ? (
                  <div className="w-full h-[140px] rounded-[24px] overflow-hidden mb-4 bg-gray-100">
                    <img src={t.eventImage} alt={t.eventTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="w-full h-[140px] bg-white/50 rounded-[24px] flex items-center justify-center text-[#5E6C84] font-bold text-[13px] mb-4 border border-white">
                    No Image Available
                  </div>
                )}
                <div className="px-1">
                  {t.teamName && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-700 mb-1.5 mr-1.5">
                      Team: {t.teamName}
                    </span>
                  )}
                  {t.attended && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-100 text-green-700 mb-1.5">
                      ✓ Attended
                    </span>
                  )}
                  <h3 className="font-bold text-[17px] text-[#1D1D1F] leading-tight truncate">{t.eventTitle}</h3>
                  <p className="text-[13px] text-[#5E6C84] font-medium mt-1">Ticket for {t.participantName}</p>
                  <p className="text-[12px] text-[#86868B] font-medium mt-0.5">{t.eventDate}</p>

                  {t.hasCertificate && (
                    t.attended ? (
                      <button
                        onClick={(e) => handleCertDownload(e, t, setDownloadingId)}
                        disabled={downloadingId === t.registrationId}
                        className="mt-3 w-full py-2 rounded-full bg-[#1D1D1F] text-white text-[12px] font-bold hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {downloadingId === t.registrationId ? 'Generating…' : 'Download Certificate'}
                      </button>
                    ) : (
                      <p className="mt-3 text-[11px] text-[#A0AEC0] font-medium">
                        Certificate unlocks once your ticket is scanned at the event
                      </p>
                    )
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTickets;
