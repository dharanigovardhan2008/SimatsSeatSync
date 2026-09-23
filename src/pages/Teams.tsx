// Teams Management Page - Instagram-Style Team Requests & Auto-Booking Setup
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import {
  getMyTeam,
  saveMyTeam,
  sendTeamInvite,
  respondToTeamInvite,
  cancelTeamInvite,
  subscribeToTeamInvitesSent,
  subscribeToIncomingTeamInvites,
  subscribeToTeamsJoined,
  getUserByEmail,
  type TeamInvitation,
  type UserTeam,
} from '@/lib/firebase';
import { Users, UserPlus, Check, X, Clock, Shield, Sparkles, AlertCircle, RefreshCw, Trash2, Mail, Building } from 'lucide-react';

export const Teams: React.FC = () => {
  const { userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [teamName, setTeamName] = useState('');
  const [savedTeam, setSavedTeam] = useState<UserTeam | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Invites state
  const [sentInvites, setSentInvites] = useState<TeamInvitation[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<TeamInvitation[]>([]);
  const [teamsJoined, setTeamsJoined] = useState<TeamInvitation[]>([]);

  // Search & add teammate state
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !userData) {
      navigate('/login?redirect=/teams');
    }
  }, [userData, authLoading, navigate]);

  // Load user's team
  useEffect(() => {
    if (!userData) return;
    getMyTeam(userData.id).then((team) => {
      if (team) {
        setSavedTeam(team);
        setTeamName(team.team_name);
      } else {
        setTeamName(`${userData.name}'s Squad`);
      }
    });
  }, [userData]);

  // Real-time subscription to sent invites (Leader's squad)
  useEffect(() => {
    if (!userData) return;
    const unsub = subscribeToTeamInvitesSent(userData.id, (invites) => {
      setSentInvites(invites);
    });
    return () => unsub();
  }, [userData]);

  // Real-time subscription to incoming invites (Requests received from other leaders)
  useEffect(() => {
    if (!userData) return;
    const unsub = subscribeToIncomingTeamInvites(userData.id, (invites) => {
      setIncomingInvites(invites);
    });
    return () => unsub();
  }, [userData]);

  // Real-time subscription to teams joined
  useEffect(() => {
    if (!userData) return;
    const unsub = subscribeToTeamsJoined(userData.id, (teams) => {
      setTeamsJoined(teams);
    });
    return () => unsub();
  }, [userData]);

  // Save / Update Team Name
  const handleSaveTeamName = async () => {
    if (!userData || !teamName.trim()) return;
    setSavingName(true);
    try {
      await saveMyTeam(userData.id, teamName.trim(), {
        name: userData.name,
        email: userData.email,
      });
      setSavedTeam((prev) => (prev ? { ...prev, team_name: teamName.trim() } : {
        leader_id: userData.id,
        leader_name: userData.name,
        team_name: teamName.trim(),
      }));
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to save team name:', err);
    } finally {
      setSavingName(false);
    }
  };

  // Send Teammate Request
  const handleInviteTeammate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !searchEmail.trim()) return;

    setSearching(true);
    setSearchError('');
    setSearchSuccess('');

    try {
      const targetUser = await getUserByEmail(searchEmail.trim());
      if (!targetUser) {
        setSearchError('No student account found with this email address. Please make sure they have registered on SeatSync.');
        return;
      }

      if (targetUser.id === userData.id) {
        setSearchError('You cannot add yourself as a teammate.');
        return;
      }

      await sendTeamInvite(
        { id: userData.id, name: userData.name, email: userData.email },
        teamName.trim() || `${userData.name}'s Squad`,
        {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          department: targetUser.department,
        }
      );

      setSearchSuccess(`Invitation sent to ${targetUser.name}! It will show as "Under Progress" until they accept.`);
      setSearchEmail('');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Could not send invitation.');
    } finally {
      setSearching(false);
    }
  };

  // Respond to incoming invite (Accept / Reject)
  const handleRespond = async (inviteId: string, status: 'accepted' | 'rejected') => {
    setActionBusy(inviteId);
    try {
      await respondToTeamInvite(inviteId, status);
    } catch (err) {
      console.error('Failed to respond to invite:', err);
    } finally {
      setActionBusy(null);
    }
  };

  // Cancel or remove teammate invite
  const handleCancelInvite = async (inviteId: string) => {
    setActionBusy(inviteId);
    try {
      await cancelTeamInvite(inviteId);
    } catch (err) {
      console.error('Failed to cancel invite:', err);
    } finally {
      setActionBusy(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <CompactLoader size="lg" className="text-[#1D1D1F]" />
      </div>
    );
  }

  const acceptedCount = sentInvites.filter((i) => i.status === 'accepted').length;
  const pendingCount = sentInvites.filter((i) => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-transparent font-sans pb-24" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 flex flex-col gap-8">

        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-[0_12px_40px_rgba(0,100,200,0.06)]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-2xl bg-[#3B9EFF]/10 text-[#3B9EFF]">
                <Users size={22} />
              </span>
              <span className="text-[12px] font-black uppercase tracking-wider text-[#3B9EFF]">Team Hub</span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-black text-[#1D1D1F] tracking-tight">
              Manage Teammates
            </h1>
            <p className="text-[14px] text-[#5E6C84] font-medium max-w-xl mt-1">
              Add your teammates once. When you enroll in team events, all accepted members are automatically registered and receive tickets in their accounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-sm text-center">
              <p className="text-[11px] font-bold text-[#86868B] uppercase">Accepted</p>
              <p className="text-[20px] font-black text-[#1D1D1F]">{acceptedCount}</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-sm text-center">
              <p className="text-[11px] font-bold text-[#86868B] uppercase">Pending</p>
              <p className="text-[20px] font-black text-[#F59E0B]">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: INCOMING REQUESTS (INSTAGRAM STYLE) ────────────────── */}
        {incomingInvites.length > 0 && (
          <div className="bg-gradient-to-br from-[#007AFF]/10 via-white/80 to-white/90 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-[#3B9EFF]/30 shadow-[0_16px_50px_rgba(0,122,255,0.12)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B9EFF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#007AFF]"></span>
                </span>
                <h2 className="text-[20px] font-extrabold text-[#1D1D1F] tracking-tight">
                  Team Invitations ({incomingInvites.length})
                </h2>
              </div>
              <span className="text-[12px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-white shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D1D1F] to-[#3D4852] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                        {invite.leader_name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[16px] text-[#1D1D1F] leading-tight">
                          {invite.team_name}
                        </h3>
                        <p className="text-[13px] text-[#5E6C84] mt-0.5">
                          Invited by <strong className="text-[#1D1D1F]">{invite.leader_name}</strong>
                        </p>
                        {invite.leader_email && (
                          <p className="text-[11px] text-[#86868B]">{invite.leader_email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleRespond(invite.id, 'accepted')}
                      disabled={actionBusy === invite.id}
                      className="flex-1 py-2.5 px-4 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Check size={16} strokeWidth={3} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(invite.id, 'rejected')}
                      disabled={actionBusy === invite.id}
                      className="py-2.5 px-4 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-[#5E6C84] font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <X size={16} strokeWidth={2.5} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 2: MY SQUAD (AS LEADER) ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Team Settings & Add Teammate Form */}
          <div className="lg:col-span-1 flex flex-col gap-6">

            {/* Team Identity Card */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 border border-white/80 shadow-[0_12px_40px_rgba(0,100,200,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#86868B]">My Team Name</span>
                {!isEditingName && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[12px] font-bold text-[#3B9EFF] hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Byte Squad"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-[#1D1D1F] font-bold text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/40"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTeamName}
                      disabled={savingName || !teamName.trim()}
                      className="flex-1 py-2 px-3 rounded-full bg-[#1D1D1F] text-white font-bold text-[12px] hover:bg-black transition-all disabled:opacity-50"
                    >
                      {savingName ? 'Saving...' : 'Save Name'}
                    </button>
                    <button
                      onClick={() => {
                        setTeamName(savedTeam?.team_name || `${userData?.name}'s Squad`);
                        setIsEditingName(false);
                      }}
                      className="py-2 px-3 rounded-full bg-gray-100 text-[#5E6C84] font-bold text-[12px] hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-[22px] font-black text-[#1D1D1F] leading-tight">
                    {teamName || `${userData?.name}'s Squad`}
                  </h2>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-[13px] text-[#5E6C84]">
                    <Shield size={16} className="text-[#3B9EFF]" />
                    <span>Leader: <strong>You ({userData?.name})</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Teammate Card */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 border border-white/80 shadow-[0_12px_40px_rgba(0,100,200,0.06)]">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={18} className="text-[#3B9EFF]" />
                <h3 className="text-[17px] font-extrabold text-[#1D1D1F] tracking-tight">
                  Add Teammate
                </h3>
              </div>
              <p className="text-[13px] text-[#5E6C84] mb-4">
                Enter your teammate's registered email address to send an invitation.
              </p>

              <form onSubmit={handleInviteTeammate} className="flex flex-col gap-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-3.5 text-[#86868B]" />
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      if (searchError) setSearchError('');
                      if (searchSuccess) setSearchSuccess('');
                    }}
                    placeholder="student@gmail.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-[#1D1D1F] font-medium text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B9EFF]/40"
                  />
                </div>

                {searchError && (
                  <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-[12px] font-medium flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p>{searchError}</p>
                  </div>
                )}

                {searchSuccess && (
                  <div className="p-3 rounded-2xl bg-green-50 text-green-700 text-[12px] font-medium flex items-start gap-2">
                    <Check size={15} className="shrink-0 mt-0.5" />
                    <p>{searchSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={searching || !searchEmail.trim()}
                  className="w-full py-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-bold text-[14px] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <CompactLoader size="sm" className="text-white" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Send Team Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Teammates List with Instagram-style Statuses */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-[0_12px_40px_rgba(0,100,200,0.06)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#1D1D1F] tracking-tight">
                  Team Members & Requests
                </h2>
                <p className="text-[13px] text-[#5E6C84] mt-0.5">
                  Live status of your team members
                </p>
              </div>
              <span className="text-[12px] font-bold bg-gray-100 text-[#5E6C84] px-3 py-1.5 rounded-full">
                {sentInvites.length + 1} Total
              </span>
            </div>

            {/* List */}
            <div className="space-y-3.5 flex-1">

              {/* Leader Row (Always Fixed) */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/80 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {userData?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-[15px] text-[#1D1D1F]">{userData?.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3B9EFF]/10 text-[#3B9EFF]">
                        Leader (You)
                      </span>
                    </div>
                    <p className="text-[12px] text-[#86868B]">{userData?.email} · {userData?.department}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                  <Check size={12} strokeWidth={3} /> Active
                </span>
              </div>

              {/* Invited Teammates */}
              {sentInvites.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-gray-50/60 border border-dashed border-gray-200">
                  <Users size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-[15px] text-[#1D1D1F]">No teammates added yet</p>
                  <p className="text-[13px] text-[#5E6C84] max-w-xs mx-auto mt-1">
                    Add students using their email on the left. Once they accept, they will appear here.
                  </p>
                </div>
              ) : (
                sentInvites.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-[#1D1D1F] flex items-center justify-center font-bold text-sm">
                        {member.recipient_name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[15px] text-[#1D1D1F]">{member.recipient_name}</p>
                          {member.recipient_department && (
                            <span className="text-[11px] font-medium text-[#86868B] bg-gray-100 px-2 py-0.5 rounded-md">
                              {member.recipient_department}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#86868B]">{member.recipient_email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">

                      {/* Status Badges */}
                      {member.status === 'accepted' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1 shadow-sm">
                          <Check size={12} strokeWidth={3} /> Accepted
                        </span>
                      )}

                      {member.status === 'pending' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 shadow-sm animate-pulse">
                          <Clock size={12} strokeWidth={2.5} /> Under Progress
                        </span>
                      )}

                      {member.status === 'rejected' && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1 shadow-sm">
                          <X size={12} strokeWidth={2.5} /> Rejected
                        </span>
                      )}

                      {/* Remove / Cancel button */}
                      <button
                        onClick={() => handleCancelInvite(member.id)}
                        disabled={actionBusy === member.id}
                        title={member.status === 'pending' ? 'Cancel Request' : 'Remove Teammate'}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Auto-Booking Explainer Pill */}
            <div className="mt-6 p-4 rounded-2xl bg-[#3B9EFF]/5 border border-[#3B9EFF]/20 flex items-start gap-3">
              <Sparkles size={18} className="text-[#3B9EFF] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#1D1D1F] font-medium leading-relaxed">
                <strong>Auto-Booking Ready:</strong> When booking a team event, simply select your saved team. Any teammate with the <span className="text-green-700 font-bold">Accepted</span> status will automatically have tickets generated in their account!
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: TEAMS I'VE JOINED (AS MEMBER) ────────────────────── */}
        {teamsJoined.length > 0 && (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-[0_12px_40px_rgba(0,100,200,0.06)]">
            <h2 className="text-[20px] font-extrabold text-[#1D1D1F] tracking-tight mb-4">
              Teams I Belong To
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamsJoined.map((team) => (
                <div
                  key={team.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-extrabold text-base">
                      {team.team_name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[16px] text-[#1D1D1F]">{team.team_name}</h3>
                      <p className="text-[13px] text-[#5E6C84]">
                        Led by <strong className="text-[#1D1D1F]">{team.leader_name}</strong>
                      </p>
                      {team.leader_email && <p className="text-[11px] text-[#86868B]">{team.leader_email}</p>}
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-green-50 text-green-700 border border-green-200">
                    Member
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Teams;
