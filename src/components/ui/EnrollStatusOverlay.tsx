import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type Phase = 'idle' | 'enrolling' | 'success';

interface EnrollStatusOverlayProps {
  phase: Phase;
  title?: string;
  subtitle?: string;
  /** Fires once the success animation has finished playing. */
  onDone?: () => void;
  /** How long the success state stays up before onDone (ms). */
  duration?: number;
}

/**
 * Plays a warm three-note arpeggio with a soft bell timbre.
 *
 * The earlier version used two bare sine tones with a hard attack, which
 * read as a harsh "beep". This builds each note from a fundamental plus
 * two quieter harmonics, adds a gentle attack/decay envelope and a
 * lowpass filter, and spaces the notes as a major triad so the result
 * lands as a pleasant chime rather than an alert.
 *
 * Browsers block audio until the user interacts with the page; since this
 * only fires after a click that condition is already met. Every failure is
 * swallowed — sound is decorative and must never break the UI.
 */
const playSuccessChime = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.9;

    // Rolls off the harsh upper harmonics so the bell sounds soft.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.16;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.11;

    master.connect(filter);
    filter.connect(ctx.destination);
    // Cheap pseudo-reverb: one short feedback tap gives the notes a tail.
    filter.connect(delay);
    delay.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    const now = ctx.currentTime;

    const note = (freq: number, start: number, dur: number, gain: number) => {
      // Fundamental + two harmonics at decreasing volume = bell-like tone.
      [
        { mult: 1, level: 1 },
        { mult: 2, level: 0.32 },
        { mult: 3.01, level: 0.12 },
      ].forEach(({ mult, level }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * mult, now + start);

        const peak = gain * level;
        g.gain.setValueAtTime(0.0001, now + start);
        g.gain.exponentialRampToValueAtTime(peak, now + start + 0.035); // soft attack
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur); // long decay

        osc.connect(g);
        g.connect(master);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    };

    // C6 – E6 – G6, a major triad rolled upward.
    note(1046.5, 0.0, 0.55, 0.18);
    note(1318.5, 0.09, 0.6, 0.16);
    note(1568.0, 0.18, 0.95, 0.15);

    setTimeout(() => ctx.close().catch(() => {}), 2200);
  } catch {
    /* audio is decorative — ignore */
  }
};

export const EnrollStatusOverlay: React.FC<EnrollStatusOverlayProps> = ({
  phase,
  title = 'Registration Complete',
  subtitle = 'Your ticket is ready',
  onDone,
  duration = 2100,
}) => {
  const playedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'success') {
      if (phase === 'idle') playedRef.current = false;
      return;
    }
    if (!playedRef.current) {
      playedRef.current = true;
      playSuccessChime();
    }
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [phase, duration, onDone]);

  if (phase === 'idle') return null;

  const isSuccess = phase === 'success';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-md es-fade">
      <style>{`
        @keyframes es-fade { from { opacity:0 } to { opacity:1 } }
        .es-fade { animation: es-fade .25s ease-out both }

        @keyframes es-card {
          0%   { transform: scale(.85) translateY(8px); opacity:0 }
          100% { transform: scale(1) translateY(0); opacity:1 }
        }
        .es-card { animation: es-card .35s cubic-bezier(.2,.9,.3,1.1) both }

        /* Enrolling: orbiting dual ring */
        @keyframes es-spin { to { transform: rotate(360deg) } }
        .es-spin  { animation: es-spin 1s linear infinite }
        .es-spin-r{ animation: es-spin 1.5s linear infinite reverse }

        @keyframes es-breathe {
          0%,100% { transform: scale(1); opacity:.55 }
          50%     { transform: scale(1.12); opacity:.25 }
        }
        .es-breathe { animation: es-breathe 1.6s ease-in-out infinite }

        /* Success: burst + draw */
        @keyframes es-pop {
          0%   { transform: scale(.3); opacity:0 }
          55%  { transform: scale(1.14); opacity:1 }
          75%  { transform: scale(.96) }
          100% { transform: scale(1); opacity:1 }
        }
        .es-pop { animation: es-pop .55s cubic-bezier(.2,.9,.3,1.35) both }

        @keyframes es-ring {
          0%   { transform: scale(.65); opacity:.65 }
          100% { transform: scale(2.1); opacity:0 }
        }
        .es-ring  { animation: es-ring 1.3s cubic-bezier(.2,.7,.4,1) .15s infinite }
        .es-ring2 { animation: es-ring 1.3s cubic-bezier(.2,.7,.4,1) .55s infinite }

        @keyframes es-draw { to { stroke-dashoffset: 0 } }
        .es-check {
          stroke-dasharray: 48; stroke-dashoffset: 48;
          animation: es-draw .42s cubic-bezier(.65,0,.45,1) .28s forwards;
        }

        @keyframes es-spark {
          0%   { transform: translate(0,0) scale(1); opacity:1 }
          100% { transform: translate(var(--dx), var(--dy)) scale(.2); opacity:0 }
        }
        .es-spark { animation: es-spark .75s ease-out .3s both }

        @keyframes es-rise {
          from { opacity:0; transform: translateY(10px) }
          to   { opacity:1; transform: translateY(0) }
        }
        .es-rise  { animation: es-rise .4s ease-out .5s both }
        .es-rise2 { animation: es-rise .4s ease-out .62s both }

        @media (prefers-reduced-motion: reduce) {
          .es-card,.es-pop,.es-ring,.es-ring2,.es-check,.es-spark,.es-rise,.es-rise2,
          .es-fade,.es-spin,.es-spin-r,.es-breathe {
            animation: none !important; stroke-dashoffset: 0 !important; opacity: 1 !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-[34px] px-11 py-10 shadow-2xl flex flex-col items-center max-w-[330px] mx-4 es-card">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          {isSuccess ? (
            <>
              <span className="absolute w-20 h-20 rounded-full bg-[#34C759]/25 es-ring" />
              <span className="absolute w-20 h-20 rounded-full bg-[#34C759]/20 es-ring2" />

              {/* Sparks flying outward from the tick */}
              {[
                { dx: '34px', dy: '-30px' }, { dx: '-36px', dy: '-26px' },
                { dx: '40px', dy: '22px' },  { dx: '-32px', dy: '32px' },
                { dx: '2px', dy: '-44px' },  { dx: '-6px', dy: '44px' },
              ].map((s, i) => (
                <span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#34C759] es-spark"
                  style={{ ['--dx' as string]: s.dx, ['--dy' as string]: s.dy }}
                />
              ))}

              <span className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#34C759] to-[#28A745] flex items-center justify-center shadow-lg es-pop">
                <svg
                  viewBox="0 0 52 52" className="w-11 h-11" fill="none" stroke="white"
                  strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path className="es-check" d="M14 27 L23 36 L38 18" />
                </svg>
              </span>
            </>
          ) : (
            <>
              <span className="absolute w-20 h-20 rounded-full bg-[#3B9EFF]/20 es-breathe" />
              <span className="absolute w-20 h-20 rounded-full border-[3px] border-[#3B9EFF]/20 border-t-[#3B9EFF] es-spin" />
              <span className="absolute w-14 h-14 rounded-full border-[3px] border-transparent border-b-[#007AFF] es-spin-r" />
            </>
          )}
        </div>

        <h3
          className={`text-[19px] font-extrabold text-[#1D1D1F] tracking-tight text-center ${
            isSuccess ? 'es-rise' : ''
          }`}
        >
          {isSuccess ? title : 'Confirming your seat'}
        </h3>
        <p
          className={`text-[14px] text-[#5E6C84] font-medium mt-1.5 text-center ${
            isSuccess ? 'es-rise2' : ''
          }`}
        >
          {isSuccess ? subtitle : 'Just a moment…'}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default EnrollStatusOverlay;
