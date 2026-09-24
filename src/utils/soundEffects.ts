/**
 * Sound Effects Utility
 *
 * Generates celebratory sounds using Web Audio API
 * No external audio files needed
 * Respects device mute state
 */

/**
 * Play a pleasant success chime (major triad chord)
 * Similar to EnrollStatusOverlay but lighter for payment success
 */
export const playSuccessSound = () => {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContext) return; // Audio not supported

    const ctx = new AudioContext();

    // Check if audio context is running (not muted/suspended)
    if (ctx.state === 'suspended') {
      // Resume audio context on user interaction
      ctx.resume().catch(() => {});
    }

    const master = ctx.createGain();
    master.gain.value = 0.7; // Slightly quieter than the enrollment sound

    // Lowpass filter for smooth tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 4000;
    filter.Q.value = 0.8;

    // Simple reverb effect
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.1;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.08;

    master.connect(filter);
    filter.connect(ctx.destination);
    filter.connect(delay);
    delay.connect(reverbGain);
    reverbGain.connect(ctx.destination);

    const now = ctx.currentTime;

    /**
     * Play a musical note with harmonics
     * @param freq Frequency in Hz
     * @param start Start time in seconds
     * @param dur Duration in seconds
     * @param gain Volume (0-1)
     */
    const playNote = (freq: number, start: number, dur: number, gain: number) => {
      // Fundamental + 2 harmonics for pleasant bell-like tone
      [
        { mult: 1, level: 1 },
        { mult: 2, level: 0.3 },
        { mult: 3.01, level: 0.1 },
      ].forEach(({ mult, level }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * mult, now + start);

        const peak = gain * level;
        // Soft attack
        g.gain.setValueAtTime(0.0001, now + start);
        g.gain.exponentialRampToValueAtTime(peak, now + start + 0.03);
        // Gentle decay
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(g);
        g.connect(master);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    };

    // Play C6 - E6 - G6 (major triad, rising arpeggio)
    playNote(1046.5, 0.0, 0.4, 0.15); // C6
    playNote(1318.5, 0.08, 0.5, 0.14); // E6
    playNote(1568.0, 0.16, 0.6, 0.13); // G6

    // Close audio context after sound finishes
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch (err) {
    // Audio generation failed - sound is optional, don't break UI
    console.debug('Sound effect generation failed:', err);
  }
};

/**
 * Play an error/alert sound (quick beep)
 * Optional - currently not used but available for failure scenarios
 */
export const playErrorSound = () => {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContext) return;

    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const master = ctx.createGain();
    master.gain.value = 0.5;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(master);
    master.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 300);
  } catch (err) {
    console.debug('Error sound generation failed:', err);
  }
};
