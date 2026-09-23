import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Copy, Check, Share2 } from 'lucide-react';
import { getTeamDoc, type TeamInfo } from '@/lib/firebase';

export const TeamInvite: React.FC = () => {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  // The leader's own registration — so "View My Ticket" opens just their
  // ticket, not a page listing every teammate's.
  const myTicketId = searchParams.get('ticket');
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    getTeamDoc(teamId).then(setTeam);
  }, [teamId]);

  const inviteUrl = `${window.location.origin}/join-team/${teamId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard permission denied — the link is still visible to copy manually */
    }
  };

  const copyCode = async () => {
    if (!team?.join_code) return;
    try {
      await navigator.clipboard.writeText(team.join_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      /* clipboard permission denied */
    }
  };

  const shareLink = async () => {
    const text = team?.join_code
      ? `Join my team "${team.team_name}"! Use code ${team.join_code} or this link: ${inviteUrl}`
      : inviteUrl;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my team', text, url: inviteUrl });
      } catch {
        /* user cancelled the share sheet */
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] via-[#F0F7FF] to-[#F8FBFF] flex items-center justify-center px-4" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <div className="bg-white/85 backdrop-blur-2xl rounded-[36px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,100,200,0.1)] border border-white max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#34C759]/15 flex items-center justify-center mx-auto mb-5">
          <Check className="text-[#34C759]" size={28} strokeWidth={3} />
        </div>

        <h1 className="text-[24px] font-extrabold text-[#1D1D1F] tracking-tight mb-2">
          You're registered as team leader
        </h1>
        <p className="text-[#5E6C84] font-medium mb-8">
          Give your teammates the code below, or share the link — either way, each one signs in and
          joins on their own. You don't need to enter their details.
        </p>

        {team?.join_code && (
          <div className="mb-4">
            <p className="text-[11px] font-black text-[#86868B] uppercase tracking-wider mb-2">Team Code</p>
            <button
              onClick={copyCode}
              className="w-full py-4 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center gap-3 hover:bg-black transition-colors active:scale-95"
            >
              <span className="text-[28px] font-black tracking-[0.3em]">{team.join_code}</span>
              {codeCopied ? <Check size={20} className="text-[#34C759]" /> : <Copy size={18} className="text-white/70" />}
            </button>
          </div>
        )}

        <div className="bg-[#F9F9FB] border border-black/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <p className="flex-1 text-[13px] text-[#1D1D1F] font-mono truncate text-left">{inviteUrl}</p>
          <button
            onClick={copyLink}
            className="shrink-0 w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors"
            aria-label="Copy invite link"
          >
            {copied ? <Check size={16} className="text-[#34C759]" /> : <Copy size={16} className="text-[#1D1D1F]" />}
          </button>
        </div>

        <button
          onClick={shareLink}
          className="w-full py-3.5 rounded-full bg-[#F9F9FB] border border-black/5 text-[#1D1D1F] font-bold text-[15px] hover:bg-black/5 transition-colors active:scale-95 flex items-center justify-center gap-2 mb-3"
        >
          <Share2 size={17} /> Share Invite
        </button>

        <Link
          to={myTicketId ? `/ticket/${myTicketId}` : `/team-tickets/${teamId}`}
          className="block w-full py-3.5 rounded-full bg-[#1D1D1F] text-white font-bold text-[15px] hover:bg-black transition-colors"
        >
          View My Ticket
        </Link>
      </div>
    </div>
  );
};

export default TeamInvite;