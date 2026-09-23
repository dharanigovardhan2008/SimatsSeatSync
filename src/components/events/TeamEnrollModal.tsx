import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface TeamEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderName: string;
  maxTeamSize: number;
  requiresEmail: boolean;
  submitting: boolean;
  error?: string;
  onSubmit: (teamName: string, teammates: { name: string; email?: string }[]) => void;
}

// Collects a team name plus every *other* teammate's details — the
// signed-in student (leader) is shown as an already-filled row and is
// not asked for again.
export const TeamEnrollModal: React.FC<TeamEnrollModalProps> = ({
  isOpen, onClose, leaderName, maxTeamSize, requiresEmail, submitting, error, onSubmit,
}) => {
  const [teamName, setTeamName] = useState('');
  // Start with 1 teammate row (total team size = 2). Max additional rows = maxTeamSize - 1.
  const [teammates, setTeammates] = useState<{ name: string; email: string }[]>([{ name: '', email: '' }]);

  const maxTeammates = Math.max(0, maxTeamSize - 1);

  const updateTeammate = (i: number, field: 'name' | 'email', value: string) => {
    setTeammates(prev => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const addTeammate = () => {
    if (teammates.length >= maxTeammates) return;
    setTeammates(prev => [...prev, { name: '', email: '' }]);
  };

  const removeTeammate = (i: number) => {
    setTeammates(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = teammates
      .map(t => ({ name: t.name.trim(), email: t.email.trim() }))
      .filter(t => t.name);
    onSubmit(
      teamName.trim(),
      cleaned.map(t => (requiresEmail ? t : { name: t.name }))
    );
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
              <label className="block text-sm font-medium text-[#3D4852]">Other Teammates</label>
              <span className="text-xs text-[#6B7280]">{teammates.length}/{maxTeammates}</span>
            </div>
            <div className="space-y-3">
              {teammates.map((t, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder={`Teammate ${i + 2} name`}
                      value={t.name}
                      onChange={(e) => updateTeammate(i, 'name', e.target.value)}
                    />
                    {requiresEmail && (
                      <Input
                        type="email"
                        placeholder="Gmail address"
                        value={t.email}
                        onChange={(e) => updateTeammate(i, 'email', e.target.value)}
                        required={!!t.name}
                      />
                    )}
                  </div>
                  {teammates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeammate(i)}
                      className="text-red-500 text-sm px-2 py-3"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {teammates.length < maxTeammates && (
              <button
                type="button"
                onClick={addTeammate}
                className="mt-3 text-sm font-semibold text-[#6C63FF] hover:underline"
              >
                + Add another teammate
              </button>
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
