import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { downloadCertificate } from '@/lib/certificate';
import html2canvas from 'html2canvas';
import { useAuth } from '@/context/AuthContext';
import { getRegistrationById, getEventById } from '@/lib/firebase';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CompactLoader } from '@/components/ui/CompactLoader';
import type { DocumentData } from 'firebase/firestore';

export const Ticket: React.FC = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [registration, setRegistration] = useState<DocumentData | null>(null);
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!registrationId) return;
    (async () => {
      const reg = await getRegistrationById(registrationId);
      setRegistration(reg);
      if (reg?.event_id) {
        const ev = await getEventById(reg.event_id);
        setEvent(ev);
      }
      setLoading(false);
    })();
  }, [registrationId]);

  useEffect(() => {
    if (barcodeRef.current && registrationId) {
      JsBarcode(barcodeRef.current, registrationId, {
        format: 'CODE128',
        width: 1.6,
        height: 55,
        displayValue: false,
        margin: 0,
      });
    }
  }, [registrationId, loading]);

  // The QR just encodes the registration ID. A coordinator/admin scanning
  // it is always inside this same authenticated app (see ScanQR.tsx), so
  // there's no need to cram the participant's details into the code
  // itself — the scanner just looks the ID up in Firestore, which also
  // means the attendance flag it writes is always the current, correct
  // state rather than something baked into a code printed earlier.
  useEffect(() => {
    if (!registrationId) return;
    QRCode.toDataURL(registrationId, { width: 240, margin: 1, color: { dark: '#1D1D1F', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch((err) => console.error('Could not generate QR code:', err));
  }, [registrationId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (time?: string) => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    if (Number.isNaN(h)) return time;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes}${ampm}`;
  };

  // Download the ticket card as a PNG, matching what's rendered on screen.
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${(event?.title || 'ticket').replace(/\s+/g, '-').toLowerCase()}-ticket.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Could not generate ticket image:', err);
      // Fall back to browser print if canvas export fails (e.g. CORS-blocked image)
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // Composites the attendee's name onto the coordinator's uploaded
  // certificate template — see src/lib/certificate.ts for how the font
  // and position saved on the event get applied.
  const handleDownloadCertificate = async () => {
    if (!event?.certificate_template_url) return;
    setGeneratingCert(true);
    try {
      await downloadCertificate(event, registration?.participant_name || userData?.name || '');
    } catch (err) {
      console.error('Could not generate certificate:', err);
      alert('Could not generate the certificate. Please try again or contact the event coordinator.');
    } finally {
      setGeneratingCert(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your ticket..." />;
  }

  if (!registration || !event) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-gray-500">
        Ticket not found.
      </div>
    );
  }

  if (registration.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-bold text-gray-900 mb-1">This registration was cancelled</p>
          <p className="text-gray-500 text-sm">This ticket is no longer valid for entry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-semibold text-gray-900 text-lg">Tickets</h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-11 h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-gray-700 disabled:opacity-50"
          aria-label="Download ticket"
        >
          {downloading ? (
            <CompactLoader size="sm" className="text-gray-400" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          )}
        </button>
      </div>

      {/* Ticket card */}
      <div className="max-w-md mx-auto w-full px-5 mt-4 pb-10">
        <div ref={ticketRef} className="rounded-[28px] overflow-hidden shadow-xl bg-white">
          {/* Hero image */}
          <div className="h-44 bg-gray-900 relative">
            {event.images?.[0] && (
              <img src={event.images[0]} alt="" crossOrigin="anonymous" className="w-full h-full object-cover opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 text-white font-bold text-xl leading-snug drop-shadow">
              {event.title}
            </div>
          </div>

          {/* Perforated divider with notch cut-outs */}
          <div className="relative h-0">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
            <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-gray-200" />
          </div>

          {/* Details */}
          <div className="p-6 pt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                {event.type || 'Event'}
              </span>
              <span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                </svg>
              </span>
            </div>

            <h2 className="font-bold text-xl text-gray-900">{event.title}</h2>
            {event.about && <p className="text-sm text-gray-500 mt-1">{event.about.slice(0, 70)}</p>}

            <div className="grid grid-cols-2 gap-y-5 mt-6 text-sm">
              <div>
                <p className="text-gray-400">Date</p>
                <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
              </div>
              <div>
                <p className="text-gray-400">Time</p>
                <p className="font-medium text-gray-900">{formatTime(event.start_time)}</p>
              </div>
              <div>
                <p className="text-gray-400">Location</p>
                <p className="font-medium text-gray-900">{event.location?.address || 'On campus'}</p>
              </div>
              <div>
                <p className="text-gray-400">Seats</p>
                <p className="font-medium text-gray-900">General Admission</p>
              </div>
              <div>
                <p className="text-gray-400">Ticket holder</p>
                <p className="font-medium text-gray-900">{registration.participant_name || userData?.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Issued to</p>
                <p className="font-medium text-gray-900">
                  {registration.participant_email || `ID: ${userData?.reg_no}`}
                </p>
              </div>
            </div>

            {registration.team_name && (
              <div className="mt-4">
                <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-3 py-1.5">
                  Team: {registration.team_name} {registration.is_leader ? '(Leader)' : ''}
                </span>
              </div>
            )}

            {/* Payment / attendance status */}
            {registration.payment_status === 'pending_verification' && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-sm font-semibold text-amber-700">Payment under verification</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Your QR code will work once the coordinator confirms your payment reference.
                </p>
              </div>
            )}
            {registration.payment_status === 'rejected' && (
              <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-100">
                <p className="text-sm font-semibold text-red-700">Payment could not be verified</p>
                {registration.payment_rejection_reason && (
                  <p className="text-xs text-red-600 mt-0.5">{registration.payment_rejection_reason}</p>
                )}
              </div>
            )}
            {registration.attended && (
              <div className="mt-4 flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold">Attendance marked</span>
              </div>
            )}

            {/* Second perforated divider before the QR code */}
            <div className="relative my-6">
              <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
              <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-[#f6ede4]" />
              <div className="border-t-2 border-dashed border-gray-200" />
            </div>

            <div className="flex flex-col items-center gap-4">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Check-in QR code"
                  className={`w-40 h-40 ${registration.payment_status === 'pending_verification' || registration.payment_status === 'rejected' ? 'opacity-30 grayscale' : ''}`}
                />
              )}
              <svg ref={barcodeRef} />
            </div>
          </div>
        </div>

        {/* Certificate — only unlocked once a coordinator/admin has
            scanned this ticket's QR code at the event. */}
        {event.certificate_template_url && (
          <div className="mt-6 rounded-[28px] bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Certificate of Participation</h3>
            {registration.attended ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Available now that your ticket has been scanned at the event.
                </p>
                <button
                  onClick={handleDownloadCertificate}
                  disabled={generatingCert}
                  className="w-full py-3.5 rounded-full bg-[#1D1D1F] text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                  {generatingCert ? 'Generating…' : 'Download Certificate'}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Your certificate unlocks once the event coordinator scans your ticket's QR code at the venue.
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">Show this ticket at registration</p>
      </div>
    </div>
  );
};

export default Ticket;
