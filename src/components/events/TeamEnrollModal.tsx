import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { subscribeToTeamInvitesSent, getMyTeam, type TeamInvitation } from '@/lib/firebase';
import { Check, Shield, Users, AlertCircle, Sparkles } from 'lucide-react';

export interface SelectedTeammate {
  uid: string;
  name: string;
  email?: string;
}

interface TeamEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderName: string;
  leaderId: string;
  maxTeamSize: number;
  minTeamSize?: number;
  requiresEmail?: boolean;
  submitting: boolean;
  error?: string;
  onSubmit: (teamName: string, selectedTeammates: SelectedTeammate[]) => void;
}

export const TeamEnrollModal: React.FC<TeamEnrollModalProps> = ({
  isOpen,
  onClose,
  leaderName,
  leaderId,
  maxTeamSize,
  minTeamSize = 1,
  submitting,
  error,
  onSubmit,
}) => {
  const [teamName, setTeamName] = useState('');
  const [acceptedTeammates, setAcceptedTeammates] = useState<TeamInvitation[]>([]);
  const [loadingTeammates, setLoadingTeammates] = useState(true);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  // Subscribe to the authenticated leader's real-time accepted squad members
  useEffect(() => {
    if (!isOpen || !leaderId) {
      setTeamName('');
      setAcceptedTeammates([]);
      setSelectedUids(new Set());
      setHasInitializedSelection(false);
      setLoadingTeammates(true);
      return;
    }

    setLoadingTeammates(true);

    // Fetch saved squad name
    getMyTeam(leaderId).then((team) => {
      if (team?.team_name) {
        setTeamName(team.team_name);
      } else {
        setTeamName(`${leaderName}'s Squad`);
      }
    }).catch(() => {
      setTeamName(`${leaderName}'s Squad`);
    });

    // Real-time listener for the squad invitations sent by this leader
    const unsub = subscribeToTeamInvitesSent(leaderId, (invites) => {
      const accepted = invites.filter((i) => i.status === 'accepted' && i.recipient_id);
      setAcceptedTeammates(accepted);
      setLoadingTeammates(false);

      // Preselect all accepted teammates up to max allowed when data first loads
      if (!hasInitializedSelection) {
        const initialUids = new Set<string>();
        const maxTeammatesToAdd = Math.max(0, maxTeamSize - 1);
        accepted.slice(0, maxTeammatesToAdd).forEach((t) => {
          if (t.recipient_id) {
            initialUids.add(t.recipient_id);
          }
        });
        setSelectedUids(initialUids);
        setHasInitializedSelection(true);
      }
    });

    return () => {
      unsub();
    };
  }, [isOpen, leaderId, leaderName, maxTeamSize, hasInitializedSelection]);

  const acceptedCount = acceptedTeammates.length;
  const selectedTeammatesCount = selectedUids.size;
  const totalTeamCount = 1 + selectedTeammatesCount; // Leader + selected teammates
  const maxAllowedTeammates = Math.max(0, maxTeamSize - 1);

  const isTeamSizeValid = totalTeamCount >= minTeamSize && totalTeamCount <= maxTeamSize;
  const canConfirm = teamName.trim().length > 0 && isTeamSizeValid && !submitting;

  const handleToggleTeammate = (uid: string) => {
    if (!uid) return;

    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        // Only allow selecting if not exceeding max team size
        if (next.size < maxAllowedTeammates) {
          next.add(uid);
        }
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;

    // Filter only the accepted teammates whose UIDs are selected
    const selected: SelectedTeammate[] = acceptedTeammates
      .filter((t) => t.recipient_id && selectedUids.has(t.recipient_id))
      .map((t) => ({
        uid: t.recipient_id!,
        name: t.recipient_name || 'Teammate',
        email: t.recipient_email ? t.recipient_email.trim() : undefined,
      }));

    // onSubmit delivers the selected teammates to EventDetail (leader is added at index 0 by finishTeamRegistration)
    onSubmit(teamName.trim(), selected);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-xl bg-[#3B9EFF]/10 text-[#3B9EFF]">
            <Users size={20} />
          </span>
          <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">Team Details</h2>
        </div>
        <p className="text-sm text-[#5E6C84] mb-6">
          Choose which accepted teammates from your squad will participate in this event.
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Byte Squad"
            required
          />

          {/* Leader Card (Always locked and included) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B] mb-2">
              Team Leader
            </label>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/90 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {leaderName ? leaderName.charAt(0).toUpperCase() : 'L'}
                </div>
                <div>
                  <p className="font-bold text-[14px] text-[#1D1D1F]">{leaderName}</p>
                  <p className="text-[11px] text-[#5E6C84]">Leader (You)</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#3B9EFF] bg-[#3B9EFF]/10 px-3 py-1 rounded-full">
                <Shield size={13} />
                Always Included
              </span>
            </div>
          </div>

          {/* Accepted Teammates Selection Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868B]">
                Accepted Teammates
              </label>
              <span className="text-xs font-bold text-[#3B9EFF] bg-[#3B9EFF]/10 px-2.5 py-0.5 rounded-full">
                Selected: {selectedTeammatesCount} / {acceptedCount}
              </span>
            </div>

            {loadingTeammates ? (
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-3 text-sm text-[#86868B]">
                <div className="w-4 h-4 rounded-full border-2 border-[#3B9EFF] border-t-transparent animate-spin" />
                <span>Loading your accepted squad members...</span>
              </div>
            ) : acceptedTeammates.length === 0 ? (
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 text-center">
                <p className="text-sm font-semibold text-[#1D1D1F] mb-1">No accepted teammates yet</p>
                <p className="text-xs text-[#5E6C84]">
                  You can invite teammates on the <strong>Teams</strong> page. Once they accept your invitation, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {acceptedTeammates.map((t) => {
                  const uid = t.recipient_id || '';
                  const isSelected = selectedUids.has(uid);
                  const isFull = selectedTeammatesCount >= maxAllowedTeammates && !isSelected;

                  return (
                    <button
                      key={uid || t.id}
                      type="button"
                      onClick={() => handleToggleTeammate(uid)}
                      disabled={isFull}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#3B9EFF]/10 border-[#3B9EFF]/40 shadow-sm'
                          : isFull
                          ? 'bg-gray-50 border-gray-200 opacity-40 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#3B9EFF] text-white shadow-sm'
                              : 'bg-gray-100 border border-gray-300 text-transparent'
                          }`}
                        >
                          <Check size={13} strokeWidth={3.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[14px] text-[#1D1D1F] truncate">
                            {t.recipient_name || 'Teammate'}
                          </p>
                          {t.recipient_email && (
                            <p className="text-[12px] text-[#86868B] truncate">
                              {t.recipient_email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <span className="text-[11px] font-bold text-[#3B9EFF] bg-white/80 px-2.5 py-1 rounded-full border border-[#3B9EFF]/20">
                            Selected
                          </span>
                        ) : isFull ? (
                          <span className="text-[11px] font-bold text-gray-400">
                            Team Full
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            Tap to add
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Team size info and validation guidance */}
            <div className="mt-3 flex items-center justify-between text-xs text-[#5E6C84] px-1">
              <span>
                Total team size: <strong className="text-[#1D1D1F]">{totalTeamCount}</strong> / {maxTeamSize} members
              </span>
              {minTeamSize > 1 && (
                <span>
                  Min required: <strong className="text-[#1D1D1F]">{minTeamSize}</strong>
                </span>
              )}
            </div>

            {totalTeamCount < minTeamSize && (
              <p className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1.5">
                <AlertCircle size={14} />
                Please select at least {minTeamSize - totalTeamCount} more teammate{minTeamSize - totalTeamCount > 1 ? 's' : ''} to meet the minimum team size of {minTeamSize}.
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-[15px] font-bold shadow-md"
            isLoading={submitting}
            disabled={!canConfirm}
          >
            Confirm & Enroll Team ({totalTeamCount} {totalTeamCount === 1 ? 'Member' : 'Members'})
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default TeamEnrollModal;
