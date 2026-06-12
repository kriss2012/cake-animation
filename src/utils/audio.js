// Web Audio API Synthesizer for Birthday Cake Celebration
// Synthesizes all music and sound effects dynamically in the browser.

class BirthdayAudioController {
  constructor() {
    this.ctx = null;
    this.musicNode = null;
    this.isPlayingMelody = false;
    this.melodyTimeout = null;
    this.muted = false;
    this.gainNode = null;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master gain node
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.muted ? 0 : 0.8;
    this.gainNode.connect(this.ctx.destination);
  }

  setMute(muteState) {
    this.muted = muteState;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(muteState ? 0 : 0.8, this.ctx.currentTime);
    }
  }

  // Synthesize a bell/chime sound
  playChime(freq, time, duration = 0.5) {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    
    // Bell envelope: instant attack, exponential decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(gain);
    gain.connect(this.gainNode);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  // Play a beautiful wizard-like chime sweep
  playMagicSweep() {
    if (!this.ctx) this.init();
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
    notes.forEach((freq, index) => {
      this.playChime(freq, now + index * 0.08, 0.6);
    });
  }

  // Play a balloon popping sound (short high-to-low pitch drop)
  playPop() {
    if (!this.ctx) this.init();
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.gainNode);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Play wind blowing sound (synthesized white noise)
  playBlowWind() {
    if (!this.ctx) this.init();
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.8; // 0.8 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with random white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Filter noise to sound like wind (lowpass filter sweep)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(100, now + 0.8);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    
    noiseSource.start(now);
    noiseSource.stop(now + 0.8);
  }

  // Play celebratory cheer sound
  playCheer() {
    if (!this.ctx) this.init();
    const now = this.ctx.currentTime;
    
    // Synthesize a rich brass/fanfare chord (C Major: C4, E4, G4, C5)
    const freqs = [261.63, 329.63, 392.00, 523.25];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      // Add a bit of vibrato / detuning for richness
      osc.detune.setValueAtTime(idx * 5, now);
      
      // Fanfare envelope: strong attack, decay to sustain, then release
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.setValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      
      osc.start(now);
      osc.stop(now + 2.0);
    });

    // Add high pitch bell sparkles
    setTimeout(() => {
      this.playMagicSweep();
    }, 400);
  }

  // Happy Birthday melody sequencer
  // Sequence representation: [noteFreq, durationInBeats]
  // Tempo: 120 bpm (0.5s per beat)
  getMelodyData() {
    const C4 = 261.63;
    const D4 = 293.66;
    const E4 = 329.63;
    const F4 = 349.23;
    const G4 = 392.00;
    const A4 = 440.00;
    const Bb4 = 466.16;
    const C5 = 523.25;
    const REST = 0;

    return [
      [C4, 0.75], [C4, 0.25], [D4, 1], [C4, 1], [F4, 1], [E4, 2],
      [C4, 0.75], [C4, 0.25], [D4, 1], [C4, 1], [G4, 1], [F4, 2],
      [C4, 0.75], [C4, 0.25], [C5, 1], [A4, 1], [F4, 1], [E4, 1], [D4, 2],
      [Bb4, 0.75], [Bb4, 0.25], [A4, 1], [F4, 1], [G4, 1], [F4, 2],
      [REST, 2] // Pause at the end
    ];
  }

  startMelody() {
    if (this.isPlayingMelody) return;
    this.isPlayingMelody = true;
    this.playNextMelodyNode(0);
  }

  stopMelody() {
    this.isPlayingMelody = false;
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
  }

  playNextMelodyNode(index) {
    if (!this.isPlayingMelody) return;
    
    const melody = this.getMelodyData();
    if (index >= melody.length) {
      index = 0; // Loop melody
    }

    const [freq, beats] = melody[index];
    const beatDuration = 0.45; // seconds per beat
    const noteDuration = beats * beatDuration;

    if (freq !== 0) {
      // Synthesize note (warm electric piano vibe: Sine + Triangle mix)
      const now = this.ctx.currentTime;
      
      // Node 1: Sine (fundamental)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + noteDuration - 0.02);
      osc1.connect(gain1);
      gain1.connect(this.gainNode);
      osc1.start(now);
      osc1.stop(now + noteDuration);

      // Node 2: Triangle (harmonics, softer)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now); // Octave up
      gain2.gain.setValueAtTime(0.005, now);
      gain2.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + noteDuration * 0.7);
      osc2.connect(gain2);
      gain2.connect(this.gainNode);
      osc2.start(now);
      osc2.stop(now + noteDuration);
    }

    // Schedule next note
    this.melodyTimeout = setTimeout(() => {
      this.playNextMelodyNode(index + 1);
    }, noteDuration * 1000);
  }
}

export const birthdayAudio = new BirthdayAudioController();
