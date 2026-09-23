import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface TeamChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinWithCode: (code: string) => void;
  onCreateNew: () => void;
  joining: boolean;
  error?: string;
}

/**
 * The first screen a student sees when enrolling in a team-based event:
 * join a team someone already started (by code), or start a new one.
 */
export const TeamChoiceModal: React.FC<TeamChoiceModalProps> = ({
  isOpen, onClose, onJoinWithCode, onCreateNew, joining, error,
}) => {
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onJoinWithCode(code.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1">Join or Start a Team</h2>
        <p className="text-sm text-[#5E6C84] mb-6">This is a team event — how would you like to enter?</p>

        <form onSubmit={handleJoin} className="space-y-3 mb-6">
          <Input
            label="Have a team code?"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. K7P2QX"
            maxLength={6}
            className="tracking-[0.2em] font-bold text-center uppercase"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" isLoading={joining} disabled={!code.trim()}>
            Join Team
          </Button>
        </form>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-black/10" />
          <span className="text-xs font-bold text-[#A0AEC0] uppercase">Or</span>
          <div className="flex-1 h-px bg-black/10" />
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="w-full py-3.5 rounded-full bg-[#F9F9FB] border border-black/5 text-[#1D1D1F] font-bold text-[15px] hover:bg-black/5 transition-colors"
        >
          Start a New Team
        </button>
      </div>
    </Modal>
  );
};

export default TeamChoiceModal;