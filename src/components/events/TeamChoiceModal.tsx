import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import CodeSlots from '@/components/ui/CodeSlots';
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

        <form onSubmit={handleJoin} className="space-y-5 mb-8">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[13px] font-bold text-[#86868B] uppercase tracking-wider">Have a team code?</p>
            <CodeSlots
              length={6}
              value={code}
              onChange={setCode}
              onComplete={(completedCode) => onJoinWithCode(completedCode)}
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" isLoading={joining} disabled={code.length < 6}>
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
