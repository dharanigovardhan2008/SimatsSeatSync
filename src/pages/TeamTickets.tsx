import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getRegistrationsByTeam, getEventById } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';
import { ArrowLeft, Ticket as TicketIcon } from 'lucide-react';

export const TeamTickets: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<DocumentData[]>([]);
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !user) return;
    (async () => {
      const regs = await getRegistrationsByTeam(teamId, user.uid);
      setMembers(regs);
      if (regs[0]?.event_id) {
        setEvent(await getEventById(regs[0].event_id));
      }
      setLoading(false);
    })();
  }, [teamId, user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-[#1D1D1F] pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        <button
          onClick={() => navigate('/student')}
          className="w-11 h-11 bg-white/70 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-sm border border-white/90 mb-6"
        >
          <ArrowLeft size={20} className="text-[#1D1D1F]" strokeWidth={2.5} />
        </button>

        <h1 className="font-extrabold text-[26px] tracking-tight mb-1">Team Registered!</h1>
        <p className="text-[#5E6C84] font-medium mb-8">
          {event?.title ? `${members.length} tickets generated for ${event.title}.` : `${members.length} tickets generated.`} Each teammate has their own ticket below.
        </p>

        <div className="space-y-3">
          {members.map((m) => (
            <Link
              key={m.id}
              to={`/ticket/${m.id}`}
              className="flex items-center justify-between bg-white/80 backdrop-blur-2xl rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,100,200,0.06)] border border-white hover:shadow-[0_12px_40px_rgba(0,100,200,0.1)] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white font-bold text-sm">
                  {(m.participant_name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-[#1D1D1F]">{m.participant_name}</p>
                  <p className="text-[12px] text-[#5E6C84] font-medium">
                    {m.is_leader ? 'Team Leader' : 'Teammate'}{m.participant_email ? ` · ${m.participant_email}` : ''}
                  </p>
                </div>
              </div>
              <TicketIcon size={20} className="text-[#3B9EFF]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamTickets;
