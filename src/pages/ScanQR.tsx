import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { getEventById, markAttendance, logRegistrationToSheet } from '@/lib/firebase';
import type { DocumentData } from 'firebase/firestore';

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

type ScanResult =
  | { kind: 'success'; name: string; team?: string; alreadyMarked: boolean }
  | { kind: 'error'; message: string };

// A short, sharp beep — the same kind of confirmation tone a payment
// app's QR scanner gives, not the softer "chime" used elsewhere in the
// app for celebratory moments. Synthesised so there's no audio file to
// ship; every failure is swallowed since sound here is a nice-to-have.
const playBeep = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {
    /* decorative only */
  }
};

export const ScanQR: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<DocumentData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>('');

  useEffect(() => {
    if (!authLoading && (!userData || (userData.role !== 'coordinator' && userData.role !== 'admin'))) {
      navigate('/');
    }
  }, [userData, authLoading, navigate]);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then(setEvent);
  }, [eventId]);

  const handleScanSuccess = async (decodedText: string) => {
    // Debounce: the camera keeps firing the same code every frame while
    // it's in view, so ignore repeats until the result is dismissed.
    if (processing || decodedText === lastScannedRef.current) return;
    lastScannedRef.current = decodedText;
    playBeep();
    setProcessing(true);
    try {
      const reg = await markAttendance(decodedText);

      if (event?.sheet_webhook_url) {
        logRegistrationToSheet(event.sheet_webhook_url, {
          action: 'attendance',
          event_title: event.title,
          event_id: eventId!,
          registration_id: decodedText,
          participant_name: (reg.participant_name as string) || '',
          registered_at: new Date().toISOString(),
        });
      }

      setResult({
        kind: 'success',
        name: (reg.participant_name as string) || 'Unknown',
        team: reg.team_name as string | undefined,
        alreadyMarked: !!reg.alreadyMarked,
      });
    } catch (err) {
      setResult({ kind: 'error', message: err instanceof Error ? err.message : 'Could not verify this ticket.' });
    } finally {
      setProcessing(false);
    }
  };

  const startScanning = async () => {
    setCameraError('');
    setResult(null);
    lastScannedRef.current = '';
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => handleScanSuccess(decodedText),
        () => { /* per-frame "no QR found" noise — ignore */ }
      );
      setScanning(true);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? `Could not access the camera: ${err.message}`
          : 'Could not access the camera. Check your browser permissions.'
      );
    }
  };

  const stopScanning = async () => {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  // Dismissing the popup keeps the camera running (like PhonePe/GPay,
  // which never stop the feed between scans) so the next ticket can be
  // scanned immediately without tapping "Start Camera" again.
  const dismissResult = () => {
    setResult(null);
    lastScannedRef.current = '';
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="font-display font-extrabold text-2xl text-[#3D4852] mb-1">Scan Ticket</h1>
        <p className="text-[#6B7280] mb-6">
          {event ? `Checking in for ${event.title}` : 'Point the camera at a ticket QR code to check them in.'}
        </p>

        <Card hover={false} className="overflow-hidden !p-0">
          {/* The scanner and its result popup share this relatively-
              positioned box, so the popup renders directly over the
              camera feed instead of pushed below it. */}
          <div className="relative">
            <div
              id={SCANNER_ELEMENT_ID}
              className={`w-full overflow-hidden bg-black ${scanning ? 'min-h-[340px]' : 'h-0'}`}
            />

            {!scanning && (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 rounded-full bg-[#3B9EFF]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#3B9EFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <Button variant="primary" onClick={startScanning}>Start Camera</Button>
                {cameraError && <p className="text-red-500 text-sm mt-4">{cameraError}</p>}
              </div>
            )}

            {/* Result popup — overlays the camera view, like a payment app */}
            {result && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-xs rounded-[28px] p-6 text-center shadow-2xl bg-white">
                  {result.kind === 'success' ? (
                    <>
                      <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${result.alreadyMarked ? 'bg-amber-100' : 'bg-green-100'}`}>
                        <svg className={`w-8 h-8 ${result.alreadyMarked ? 'text-amber-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-xl text-[#3D4852]">{result.name}</h3>
                      {result.team && <p className="text-sm text-[#6B7280] mt-1">Team: {result.team}</p>}
                      <p className={`text-sm font-semibold mt-2 ${result.alreadyMarked ? 'text-amber-600' : 'text-green-600'}`}>
                        {result.alreadyMarked ? 'Already checked in earlier' : 'Checked in successfully'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-red-600 font-semibold">{result.message}</p>
                    </>
                  )}
                  <Button variant="primary" size="sm" className="mt-5 w-full" onClick={dismissResult}>
                    Scan Next Ticket
                  </Button>
                </div>
              </div>
            )}
          </div>

          {scanning && (
            <div className="p-4">
              <Button variant="secondary" size="sm" className="w-full" onClick={stopScanning}>
                Stop Camera
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ScanQR;
