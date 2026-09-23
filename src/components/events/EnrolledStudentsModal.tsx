import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { subscribeToEventRegistrations } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

interface EnrolledStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

/**
 * Shows everyone registered for a single event. Solo registrations are
 * listed flat; team registrations are grouped under their team name so
 * coordinators can see team composition at a glance.
 */
export const EnrolledStudentsModal: React.FC<EnrolledStudentsModalProps> = ({
  isOpen, onClose, eventId, eventTitle,
}) => {
  const [regs, setRegs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !eventId) return;
    setLoading(true);
    setError('');
    const unsubscribe = subscribeToEventRegistrations(eventId, (data) => {
      setRegs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen, eventId]);

  const { teams, solos } = useMemo(() => {
    const teamMap = new Map<string, DocumentData[]>();
    const soloList: DocumentData[] = [];
    regs.forEach((r) => {
      if (r.team_id) {
        const list = teamMap.get(r.team_id) || [];
        list.push(r);
        teamMap.set(r.team_id, list);
      } else {
        soloList.push(r);
      }
    });
    // Leaders first within each team
    teamMap.forEach((list) =>
      list.sort((a, b) => (b.is_leader ? 1 : 0) - (a.is_leader ? 1 : 0))
    );
    return { teams: Array.from(teamMap.entries()), solos: soloList };
  }, [regs]);

  const downloadCsv = () => {
    const header = ['Name', 'Email', 'Reg No', 'Department', 'Team', 'Role'];
    const rows = regs.map((r) => [
      r.participant_name || '',
      r.participant_email || '',
      r.participant_reg_no || '',
      r.participant_department || '',
      r.team_name || '',
      r.team_id ? (r.is_leader ? 'Team Leader' : 'Member') : 'Individual',
    ]);
    // Wrap every cell so commas inside names don't break the columns
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const Row: React.FC<{ r: DocumentData; badge?: string }> = ({ r, badge }) => (
    <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-2xl bg-[#F9F9FB] border border-black/5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#6C63FF] text-white flex items-center justify-center font-bold text-sm shrink-0">
          {(r.participant_name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[14px] text-[#1D1D1F] truncate">
            {r.participant_name || 'Unnamed'}
          </p>
          <p className="text-[12px] text-[#5E6C84] truncate">
            {[r.participant_email, r.participant_reg_no, r.participant_department]
              .filter(Boolean)
              .join(' · ') || 'No further details recorded'}
          </p>
        </div>
      </div>
      {badge && (
        <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 shrink-0">
          {badge}
        </span>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <div className="p-8">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="text-2xl font-bold text-[#1D1D1F]">Enrolled Students</h2>
          {regs.length > 0 && (
            <button
              onClick={downloadCsv}
              className="text-[13px] font-bold text-[#6C63FF] hover:underline shrink-0"
            >
              Download CSV
            </button>
          )}
        </div>
        <p className="text-sm text-[#5E6C84] mb-6 truncate">{eventTitle}</p>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-7 h-7 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
        ) : regs.length === 0 ? (
          <div className="py-12 text-center text-[#5E6C84] font-medium">
            Nobody has enrolled yet.
          </div>
        ) : (
          <>
            <div className="flex gap-3 mb-5">
              <div className="flex-1 p-3 rounded-2xl bg-[#F9F9FB] border border-black/5 text-center">
                <p className="text-[11px] font-bold text-[#5E6C84] uppercase">Participants</p>
                <p className="text-xl font-extrabold text-[#1D1D1F]">{regs.length}</p>
              </div>
              <div className="flex-1 p-3 rounded-2xl bg-[#F9F9FB] border border-black/5 text-center">
                <p className="text-[11px] font-bold text-[#5E6C84] uppercase">Teams</p>
                <p className="text-xl font-extrabold text-[#1D1D1F]">{teams.length}</p>
              </div>
            </div>

            <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1">
              {teams.map(([teamId, members]) => (
                <div key={teamId}>
                  <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wide mb-2">
                    {members[0]?.team_name || 'Team'} · {members.length} members
                  </p>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <Row key={m.id} r={m} badge={m.is_leader ? 'Leader' : undefined} />
                    ))}
                  </div>
                </div>
              ))}

              {solos.length > 0 && (
                <div>
                  {teams.length > 0 && (
                    <p className="text-[12px] font-extrabold text-[#5E6C84] uppercase tracking-wide mb-2">
                      Individual Registrations
                    </p>
                  )}
                  <div className="space-y-2">
                    {solos.map((r) => (
                      <Row key={r.id} r={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default EnrolledStudentsModal;