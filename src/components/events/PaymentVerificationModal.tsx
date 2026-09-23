import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getPendingPayments, verifyPayment, rejectPayment, createNotification } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

/**
 * There's no automatic way to confirm a UPI payment (see PaymentModal for
 * why), so this is where that manual check actually happens: the
 * coordinator looks up each transaction reference in their own UPI app or
 * bank statement, then taps Verify or Reject here.
 *
 * A team only pays once — only the team leader's registration carries the
 * UTR/amount, even though every member's doc is marked
 * "pending_verification". So this groups by team and verifying/rejecting
 * acts on every member at once, not just the leader's own ticket.
 */
export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  isOpen, onClose, eventId, eventTitle,
}) => {
  const [pending, setPending] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setPending(await getPendingPayments(eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pending payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId]);

  // One entry per team (all members grouped) or per solo registration.
  const groups = useMemo(() => {
    const teamMap = new Map<string, DocumentData[]>();
    const solos: DocumentData[] = [];
    pending.forEach((r) => {
      if (r.team_id) {
        const list = teamMap.get(r.team_id) || [];
        list.push(r);
        teamMap.set(r.team_id, list);
      } else {
        solos.push(r);
      }
    });
    const teamGroups = Array.from(teamMap.entries()).map(([teamId, members]) => ({
      key: teamId,
      members,
      leader: members.find((m) => m.is_leader) || members[0],
      isTeam: true,
    }));
    const soloGroups = solos.map((r) => ({ key: r.id, members: [r], leader: r, isTeam: false }));
    return [...teamGroups, ...soloGroups];
  }, [pending]);

  // A team's members may share one uid (old upfront-entry flow) or each
  // own their own doc (invite-link joiners) — de-dupe so nobody gets
  // double-notified.
  const uniqueRecipients = (members: DocumentData[]) => Array.from(new Set(members.map((m) => m.user_id as string)));

  const handleVerify = async (group: { key: string; members: DocumentData[] }) => {
    setBusyKey(group.key);
    setError('');
    try {
      await Promise.all(group.members.map((m) => verifyPayment(m.id)));
      await Promise.all(uniqueRecipients(group.members).map((uid) =>
        createNotification(
          uid,
          'Payment Verified',
          `Your payment has been verified — check your ticket for ${eventTitle}.`,
          '/tickets'
        )
      ));
      setPending((prev) => prev.filter((r) => !group.members.some((m) => m.id === r.id)));
    } catch {
      setError('Could not mark this as verified. Please try again.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleReject = async (group: { key: string; members: DocumentData[] }) => {
    const reason = window.prompt('Reason for rejecting this payment? (optional, shown to the student)') ?? '';
    setBusyKey(group.key);
    setError('');
    try {
      await Promise.all(group.members.map((m) => rejectPayment(m.id, reason)));
      await Promise.all(uniqueRecipients(group.members).map((uid) =>
        createNotification(
          uid,
          'Payment Could Not Be Verified',
          reason
            ? `Your payment for ${eventTitle} was rejected: ${reason}`
            : `Your payment for ${eventTitle} could not be verified. Contact the coordinator.`,
          '/tickets'
        )
      ));
      setPending((prev) => prev.filter((r) => !group.members.some((m) => m.id === r.id)));
    } catch {
      setError('Could not reject this payment. Please try again.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1">Payment Verification</h2>
        <p className="text-sm text-[#5E6C84] mb-6 truncate">{eventTitle}</p>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-[#5E6C84] font-medium">
            Nothing waiting on payment verification.
          </div>
        ) : (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {groups.map((group) => (
              <div key={group.key} className="p-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[15px] text-[#1D1D1F] truncate">
                      {group.isTeam ? `Team: ${group.leader.team_name || 'Unnamed team'}` : group.leader.participant_name}
                    </p>
                    {group.isTeam && (
                      <p className="text-[12px] text-[#5E6C84]">
                        {group.members.map((m) => m.participant_name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-[15px] font-extrabold text-[#1D1D1F] shrink-0">
                    ₹{group.leader.payment_amount ?? '—'}
                  </span>
                </div>

                <div className="text-[13px] text-[#5E6C84] mb-3">
                  UTR: <span className="font-mono font-semibold text-[#1D1D1F]">{group.leader.payment_utr || '—'}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="primary" size="sm" className="flex-1"
                    isLoading={busyKey === group.key}
                    onClick={() => handleVerify(group)}
                  >
                    Verify
                  </Button>
                  <Button
                    variant="secondary" size="sm" className="flex-1"
                    disabled={busyKey === group.key}
                    onClick={() => handleReject(group)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentVerificationModal;
