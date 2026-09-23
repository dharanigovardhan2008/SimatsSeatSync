import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { subscribeToTeamsJoined, TeamInvitation } from '@/lib/firebase';
import { Check } from 'lucide-react';

interface SelectedTeammate {
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
  minTeamSize: number;
  requiresEmail: boolean;
  submitting: boolean;
  error?: string;
  onSubmit: (teamName: string, selectedMembers: SelectedTeammate[]) => void;
}

// Collects a team name plus every *other* teammate's details — the
// signed-in student (leader) is shown as an already-filled row and is
// not asked for again.
export const TeamEnrollModal: React.FC<TeamEnrollModalProps> = ({
  isOpen, onClose, leaderName, leaderId, maxTeamSize, minTeamSize, requiresEmail, submitting, error, onSubmit,
}) => {
  const [teamName, setTeamName] = useState('');
  const [acceptedTeammates, setAcceptedTeammates] = useState<TeamInvitation[]>([]);
  const [loadingTeammates, setLoadingTeammates] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());

  // Load accepted teammates when modal opens
  useEffect(() => {
    if (!isOpen || !leaderId) return;

    setLoadingTeammates(true);
    const unsub = subscribeToTeamsJoined(leaderId, (teams) => {
      const accepted = teams.filter(t => t.status === 'accepted');
      setAcceptedTeammates(accepted);
      setLoadingTeammates(false);

      // Auto-select all accepted teammates (including leader)
      const newSelectedUids = new Set<string>([leaderId]);
      accepted.forEach(t => {
        if (t.recipient_id) newSelectedUids.add(t.recipient_id);
      });
      setSelectedUids(newSelectedUids);
    });

    return () => unsub();
  }, [isOpen, leaderId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTeamName('');
      setAcceptedTeammates([]);
      setSelectedUids(new Set([leaderId]));
    }
  }, [isOpen, leaderId]);

  const maxAdditionalTeammates = Math.max(0, maxTeamSize - 1);
  const selectedCount = selectedUids.size - (selectedUids.has(leaderId) ? 1 : 0);
  const totalSelectedCount = selectedUids.size;
  const isTeamSizeValid = totalSelectedCount >= minTeamSize && totalSelectedCount <= maxTeamSize;
  const canConfirm = teamName.trim().length > 0 && isTeamSizeValid && !submitting;

  const handleToggleTeammate = (uid: string) => {
    if (uid === leaderId) return; // Leader cannot be deselected

    setSelectedUids(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        // Check if we haven't reached max team size
        if (next.size < maxTeamSize) {
          next.add(uid);
        }
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canConfirm) return;

    // Create selected members array (leader is always included)
    const leaderMember: SelectedTeammate = { uid: leaderId, name: leaderName };
    const selectedMembers: SelectedTeammate[] = [leaderMember];

    // Add selected teammates (excluding leader)
    acceptedTeammates.forEach(t => {
      if (t.recipient_id && t.recipient_id !== leaderId && selectedUids.has(t.recipient_id)) {
        selectedMembers.push({
          uid: t.recipient_id,
          name: t.recipient_name || 'Teammate',
          email: t.recipient_email || undefined
        });
      }
    });

    // Validate team size
    if (selectedMembers.length < minTeamSize || selectedMembers.length > maxTeamSize) {
      // Should not happen due to canConfirm check, but just in case
      return;
    }

    onSubmit(teamName.trim(), selectedMembers);
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1">Team Details</h2>
        <p className="text-sm text-[#5E6C84] mb-6">
          Select which accepted teammates to register for this event. Team size must be between {minTeamSize} and {maxTeamSize} members.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. The Byte Squad"
            required
          />

          {/* Current user — always the leader, prefilled and locked */}
          <div>
            <label className="block text-sm font-medium text-[#3D4852] mb-2">Team Leader (You)</label>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#3B9EFF]/10 border-2 border-[#3B9EFF]/30">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#3B9EFF] text-white">
                <Check size={14} strokeWidth={3} />
              </div>
              <p className="font-bold text-[14px] text-[#1D1D1F]">{leaderName}</p>
              <span className="ml-auto text-xs text-[#3B9EFF] font-medium">Always included</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#3D4852]">Accepted Teammates</label>
              <span className="text-xs text-[#6B7280]">
                Selected: {selectedCount} / {maxAdditionalTeammates} (Total: {totalSelectedCount})
              </span>
            </div>

            {loadingTeammates ? (
              <p className="text-sm text-[#86868B]">Loading teammates...</p>
            ) : acceptedTeammates.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-sm text-[#5E6C84]">No accepted teammates yet.</p>
                <p className="text-xs text-[#86868B] mt-1">Invite teammates from the Teams page before registering.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {acceptedTeammates.map((t) => {
                    const uid = t.recipient_id || '';
                    const isSelected = uid && selectedUids.has(uid);
                    const canSelect = selectedUids.size < maxTeamSize || isSelected;

                    return (
                      <button
                        key={uid || t.id}
                        type="button"
                        onClick={() => handleToggleTeammate(uid)}
                        disabled={!canSelect && !isSelected}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#3B9EFF]/10 border-[#3B9EFF]/30'
                            : canSelect
                              ? 'bg-white border-gray-200 hover:border-[#3B9EFF]/30'
                              : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#3B9EFF] text-white'
                            : 'bg-gray-200'
                        }`}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[14px] text-[#1D1D1F]">{t.recipient_name || 'Teammate'}</p>
                          <p className="text-[12px] text-[#86868B]">{t.recipient_email || 'No email'}</p>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-[#3B9EFF] font-medium">Selected</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Team size validation message */}
                {!isTeamSizeValid && (
                  <p className="text-xs text-red-500 mt-2">
                    Team size must be between {minTeamSize} and {maxTeamSize} members (currently {totalSelectedCount})
                  </p>
                )}
              </>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={submitting}
            disabled={!canConfirm}
          >
            Confirm & Enroll Team ({totalSelectedCount} members)
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default TeamEnrollModal;
