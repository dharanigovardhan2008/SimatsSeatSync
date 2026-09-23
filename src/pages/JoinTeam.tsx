import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PaymentModal } from '@/components/events/PaymentModal';
import { getTeamDoc, getEventById, joinTeamAsMember, logRegistrationToSheet, type TeamInfo, type PaymentProof } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

export const JoinTeam: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();

  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  // Not signed in: send them to create an account (or sign in), and back
  // here automatically afterwards via the redirect param.
  useEffect(() => {
    if (!authLoading && !user && teamId) {
      navigate(`/register?redirect=${encodeURIComponent(`/join-team/${teamId}`)}`);
    }
  }, [authLoading, user, teamId, navigate]);

  useEffect(() => {
    if (!teamId) return;
    (async () => {
      const teamDoc = await getTeamDoc(teamId);
      if (!teamDoc) {
        setError('This invite link is no longer valid.');
        setLoading(false);
        return;
      }
      setTeam(teamDoc);
      setEvent(await getEventById(teamDoc.event_id));
      setLoading(false);
    })();
  }, [teamId]);

  const doJoin = async (payment?: PaymentProof) => {
    if (!userData || !teamId) return;
    setJoining(true);
    setError('');
    try {
      const result = await joinTeamAsMember(teamId, userData.id, userData.department, userData.name, payment);
      if (event?.sheet_webhook_url) {
        logRegistrationToSheet(event.sheet_webhook_url, {
          event_title: event.title,
          event_id: result.eventId,
          registration_id: result.registrationId,
          participant_name: userData.name,
          participant_email: userData.email,
          reg_no: userData.reg_no,
          department: userData.department,
          team_name: team?.team_name,
          team_id: teamId,
          is_leader: false,
          payment_status: payment ? 'pending_verification' : undefined,
          payment_utr: payment?.utr,
          payment_amount: payment?.amount != null ? String(payment.amount) : undefined,
          registered_at: new Date().toISOString(),
        });
      }
      navigate(`/ticket/${result.registrationId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join this team');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinClick = () => {
    if (event?.is_paid) {
      setError('');
      setShowPayment(true);
      return;
    }
    doJoin();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#1D1D1F] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!team || !event) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        <div className="bg-white/85 backdrop-blur-2xl rounded-[32px] p-8 shadow-xl border border-white text-center max-w-sm">
          <p className="text-[#1D1D1F] font-bold mb-2">Invite link not found</p>
          <p className="text-[#5E6C84] text-sm">{error || 'This team may have been removed.'}</p>
        </div>
      </div>
    );
  }

  const isFull = team.member_count >= team.max_size;

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <div className="bg-white/85 backdrop-blur-2xl rounded-[36px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,100,200,0.1)] border border-white max-w-md w-full">
        <p className="text-[12px] font-black text-[#3B9EFF] uppercase tracking-wide mb-2">Team Invite</p>
        <h1 className="text-[24px] font-extrabold text-[#1D1D1F] tracking-tight mb-1">{event.title}</h1>
        <p className="text-[#5E6C84] font-medium mb-6">
          {team.leader_name} invited you to join team <strong>{team.team_name}</strong>
        </p>

        <div className="bg-[#F9F9FB] border border-black/5 rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#5E6C84]">Joining as</span>
            <span className="font-bold text-[#1D1D1F]">{userData?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5E6C84]">Team</span>
            <span className="font-bold text-[#1D1D1F]">{team.team_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5E6C84]">Members so far</span>
            <span className="font-bold text-[#1D1D1F]">{team.member_count} / {team.max_size}</span>
          </div>
          {!!event.registration_fee && (
            <div className="flex justify-between text-sm">
              <span className="text-[#5E6C84]">Fee</span>
              <span className="font-bold text-[#1D1D1F]">₹{event.registration_fee}</span>
            </div>
          )}
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {isFull ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <p className="text-amber-700 font-semibold text-sm">This team is already full.</p>
          </div>
        ) : (
          <button
            onClick={handleJoinClick}
            disabled={joining}
            className="w-full py-4 rounded-full bg-[#1D1D1F] text-white font-bold text-[15px] hover:bg-black transition-colors active:scale-95 disabled:opacity-50"
          >
            {joining ? 'Joining…' : event.is_paid ? `Pay & Join Team` : 'Join Team'}
          </button>
        )}
      </div>

      {event.is_paid && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={event.registration_fee || 0}
          upiId={event.upi_id}
          qrImage={event.payment_qr_image}
          payeeName={event.contact_name || event.coordinator_name || 'Event Organizer'}
          eventTitle={event.title}
          submitting={joining}
          error={error}
          onSubmit={(proof) => doJoin(proof)}
        />
      )}
    </div>
  );
};

export default JoinTeam;
