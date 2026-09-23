import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { subscribeToTeamsJoined, TeamInvitation, getUserDocument } from '@/lib/firebase';
import { Users, Check } from 'lucide-react';

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
  requiresEmail: boolean;
  submitting: boolean;
  error?: string;
  onSubmit: (teamName: string, selectedMembers: SelectedTeammate[]) => void;
}

// Collects a team name plus every *other* teammate's details — the
// signed-in student (leader) is shown as an already-filled row and is
// not asked for again.
export const TeamEnrollModal: React.FC<TeamEnrollModalProps> = ({
  isOpen, onClose, leaderName, leaderId, maxTeamSize, requiresEmail, submitting, error, onSubmit,
}) => {
  const [teamName, setTeamName] = useState('');
  // Start with 1 teammate row (total team size = 2). Max additional rows = maxTeamSize - 1.
  const [teammates, setTeammates] = useState<{ name: string; email: string; uid?: string }[]>([{ name: '', email: '', uid: '' }]);
  const [acceptedTeammates, setAcceptedTeammates] = useState<TeamInvitation[]>([]);
  const [loadingTeammates, setLoadingTeammates] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [leaderUid, setLeaderUid] = useState<string>('');

  // Initialize leader and accepted teammates from subscription
  useEffect(() => {
    if (!isOpen || !leaderId) return;
    setLeaderUid(leaderId);
    const initialSelected = new Set<string>([leaderId]);
    setSelectedUids(initialSelected);
    setLoadingTeammates(true);
    const unsub = subscribeToTeamsJoined(leaderId, (teams) => {
      setAcceptedTeammates(teams.filter(t => t.status === 'accepted'));
      setLoadingTeammates(false);
      // Auto-select only accepted teammates; reset selection to leader + accepted on reload
      const newSet = new Set<string>([leaderId]);
      teams.filter(t => t.status === 'accepted').forEach(t => {
        if (t.recipient_id) newSet.add(t.recipient_id);
      });
      setSelectedUids(newSet);
    });
    return () => unsub();
  }, [isOpen, leaderId]);

  useEffect(() => {
    if (!isOpen || !leaderId) return;
    setLoadingTeammates(true);
    const unsub = subscribeToTeamsJoined(leaderId, (teams) => {
      setAcceptedTeammates(teams);
      setLoadingTeammates(false);

      // Auto-initialize teammates from accepted teammates when modal opens / updates
      if (teams.length > 0) {
        const savedTeam = teams.slice(0, maxTeammates).map(t => ({
          name: t.recipient_name || '',
          email: (t.recipient_email || '').trim().toLowerCase(),
          uid: t.recipient_id || ''
        }));
        setTeammates(savedTeam);
      } else {
        setTeammates([{ name: '', email: '', uid: '' }]);
      }
    });
    return () => unsub();
  }, [isOpen, leaderId]);

  const maxTeammates = Math.max(0, maxTeamSize - 1);

  // Auto-fill with accepted teammates
  const handleUseSavedTeam = () => {
    const savedTeam = acceptedTeammates.slice(0, maxTeammates).map(t => ({
      name: t.recipient_name || '',
      email: t.recipient_email || '',
      uid: t.recipient_id || ''
    }));
    setTeammates(savedTeam.length > 0 ? savedTeam : [{ name: '', email: '', uid: '' }]);
  };

  const updateTeammate = (i: number, field: 'name' | 'email', value: string) => {
    setTeammates(prev => prev.map((t, idx) => (idx === i ? { ...t, [field]: value, uid: '' } : t)));
  };

  const addTeammate = () => {
    if (teammates.length >= maxTeammates) return;
    setTeammates(prev => [...prev, { name: '', email: '', uid: '' }]);
  };

  const removeTeammate = (i: number) => {
    setTeammates(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only selected members (use UIDs)
    const selected = acceptedTeammates
      .filter(t => t.status === 'accepted' && t.recipient_id && selectedUids.has(t.recipient_id))
      .map(t => ({ uid: t.recipient_id!, name: t.recipient_name || '', email: (t.recipient_email || '').trim() }));
    // Leader is always included
    const members: SelectedTeammate[] = [{ uid: leaderUid, name: leaderName, email: undefined }, ...selected];
    // Validate team size
    if (members.length < 1) {
      // handled via error prop or just proceed; size check done by caller
    }
    onSubmit(teamName.trim(), members);
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1">Team Details</h2>
        <p className="text-sm text-[#5E6C84] mb-6">
          Up to {maxTeamSize} members per team. After you register, you'll get a link to send your
          teammates so they can join on their own — or you can add their names below right now, whichever
          is easier.
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
            <label className="block text-sm font-medium text-[#3D4852] mb-2">You (Team Leader)</label>
            <div className="px-5 py-4 rounded-2xl bg-gray-100 text-gray-500 font-medium">{leaderName}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#3D4852]">Accepted Teammates</label>
              <span className="text-xs text-[#6B7280]">Selected: {selectedUids.size - (leaderUid ? 1 : 0)} / {maxTeammates - 1}</span>
            </div>
            {loadingTeammates ? (
              <p className="text-xs text-[#86868B]">Loading teammates...</p>
            ) : acceptedTeammates.length === 0 ? (
              <p className="text-sm text-[#5E6C84]">No accepted teammates yet. Invite teammates from the Teams page.</p>
            ) : (
              <div className="space-y-2">
                {acceptedTeammates.map((t) => {
                  const uid = t.recipient_id || '';
                  const isSelected = uid && selectedUids.has(uid);
                  return (
                    <button
                      key={uid || t.id}
                      type="button"
                      onClick={() => {
                        if (!uid) return;
                        setSelectedUids(prev => {
                          const next = new Set(prev);
                          if (next.has(uid)) next.delete(uid); else next.add(uid);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${isSelected ? 'bg-[#3B9EFF]/10 border-[#3B9EFF]/30' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#3B9EFF] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {isSelected ? <Check size={14} strokeWidth={3} /> : ''}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[14px] text-[#1D1D1F]">{t.recipient_name || 'Teammate'}</p>
                        <p className="text-[11px] text-[#86868B]">{t.recipient_email || ''}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        <Button type="submit" variant="primary" className="w-full" isLoading={submitting}>
            Confirm & Enroll Team
          </Button>
        </form>
      </div>
    </Modal>
  );
};

export default TeamEnrollModal;
