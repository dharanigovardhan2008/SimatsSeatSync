import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import CodeSlots from '@/components/ui/CodeSlots';
import { Button } from '@/components/ui/Button';
import type { CodeSlotsStatus } from '@/components/ui/CodeSlots';

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
 * Uses premium CodeSlots component for OTP-style team code entry.
 */
export const TeamChoiceModal: React.FC<TeamChoiceModalProps> = ({
  isOpen, onClose, onJoinWithCode, onCreateNew, joining, error,
}) => {
  const [code, setCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<CodeSlotsStatus>('idle');

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Reset error state when user starts typing again
    if (codeStatus === 'error') {
      setCodeStatus('idle');
    }
  };

  const handleCodeComplete = (completedCode: string) => {
    // Auto-submit when all 6 characters are entered
    setCode(completedCode);
    onJoinWithCode(completedCode);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 6) return;
    onJoinWithCode(code.trim().toUpperCase());
  };

  // Update CodeSlots status based on error prop
  React.useEffect(() => {
    if (error && code.length === 6) {
      setCodeStatus('error');
    } else if (joining) {
      setCodeStatus('idle');
    }
  }, [error, joining, code.length]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3B9EFF] to-[#007AFF] flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_rgba(59,158,255,0.25)]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-[26px] font-extrabold text-[#1D1D1F] mb-2 tracking-tight">
            Join or Start a Team
          </h2>
          <p className="text-[14px] text-[#5E6C84] font-medium">
            This is a team event — how would you like to enter?
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6 mb-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-[13px] font-extrabold text-[#86868B] uppercase tracking-wider">
              Have a Team Code?
            </p>
            <div className="flex justify-center">
              <CodeSlots
                length={6}
                value={code}
                onChange={handleCodeChange}
                onComplete={handleCodeComplete}
                status={codeStatus}
                autoFocus={true}
                accentColor="#3B9EFF"
                inkColor="#1D1D1F"
                slotColor="#F5F5F7"
                digitColor="#1D1D1F"
                dangerColor="#FF3B30"
                slotSize={48}
                gap={10}
                radius={14}
                bounce={0.25}
                settle={0.35}
                rise={10}
                cascade={25}
                ariaLabel="Team code"
              />
            </div>
            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <p className="text-red-600 text-[13px] font-semibold text-center">{error}</p>
              </div>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={joining}
            disabled={code.length < 6 || joining}
          >
            {joining ? 'Joining Team...' : 'Join Team'}
          </Button>
        </form>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
          <span className="text-[12px] font-extrabold text-[#A0AEC0] uppercase tracking-wider">Or</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          disabled={joining}
          className="w-full py-4 rounded-full bg-white/80 border-2 border-[#3B9EFF]/20 text-[#1D1D1F] font-bold text-[15px] hover:bg-[#3B9EFF]/5 hover:border-[#3B9EFF]/40 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          Start a New Team
        </button>

        <p className="text-center text-[12px] text-[#86868B] mt-6 leading-relaxed">
          Team codes are case-insensitive and 6 characters long. <br />
          Get the code from your team leader.
        </p>
      </div>
    </Modal>
  );
};

export default TeamChoiceModal;
