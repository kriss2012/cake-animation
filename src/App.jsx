import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Volume2, VolumeX, Mic, MicOff, Settings, X, 
  Sparkles, RefreshCw 
} from 'lucide-react';
import { birthdayAudio } from './utils/audio';
import WelcomeScreen from './components/WelcomeScreen';
import Cake from './components/Cake';
import Balloons from './components/Balloons';
import CelebrationCard from './components/CelebrationCard';
import AudioVisualizer from './components/AudioVisualizer';

function App() {
  const [step, setStep] = useState('welcome'); // welcome | celebrate
  const [userData, setUserData] = useState({ name: '', age: 3, flavor: 'chocolate' });
  
  // Customizer States
  const [flavor, setFlavor] = useState('chocolate');
  const [candleCount, setCandleCount] = useState(3);
  const [candleStates, setCandleStates] = useState([]); // true = lit, false = blown
  const [showSprinkles, setShowSprinkles] = useState(true);
  const [showCherries, setShowCherries] = useState(true);
  
  // Audio & Mic States
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  
  // Celebration States
  const [isAllBlown, setIsAllBlown] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Refs for tracking blow duration
  const blowDurationRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const micStreamRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  // Initialize candle states when count or setup changes
  useEffect(() => {
    setCandleStates(Array(candleCount).fill(true));
    setIsAllBlown(false);
  }, [candleCount, userData.name]); // Reset on count or user change

  // Handle music toggle
  useEffect(() => {
    if (step === 'celebrate' && musicPlaying && !isAllBlown) {
      birthdayAudio.startMelody();
    } else {
      birthdayAudio.stopMelody();
    }
  }, [musicPlaying, step, isAllBlown]);

  // Handle mute controller mapping
  useEffect(() => {
    birthdayAudio.setMute(!musicPlaying);
  }, [musicPlaying]);

  // Unified microphone analysis loop
  useEffect(() => {
    if (step !== 'celebrate' || !micEnabled || isAllBlown) {
      cleanupMic();
      return;
    }

    let audioContext = null;
    let micSource = null;
    let analyser = null;
    let dataArray = null;

    const startMic = async () => {
      try {
        birthdayAudio.init();
        audioContext = birthdayAudio.ctx;
        
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicPermissionDenied(false);

        micSource = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        micSource.connect(analyser);

        const checkVolumeLoop = () => {
          if (!analyser || isAllBlown) return;

          analyser.getByteFrequencyData(dataArray);

          // Focus on low-frequency bins (0-15) which represent blowing/rumble sound
          let lowFreqSum = 0;
          const binsToCheck = 15;
          for (let i = 0; i < binsToCheck; i++) {
            lowFreqSum += dataArray[i];
          }
          const avgLow = lowFreqSum / binsToCheck;
          // Scale it to a percentage 0 - 100
          const currentVol = Math.min(100, (avgLow / 160) * 100);
          setVolume(currentVol);

          // Blow detection timing logic
          const now = Date.now();
          const delta = (now - lastFrameTimeRef.current) / 1000;
          lastFrameTimeRef.current = now;

          if (currentVol > 35) {
            setIsBlowing(true);
            blowDurationRef.current += delta;

            // Progressive blowout: blow out candles based on duration
            // e.g., blow out a candle every 0.20 seconds of active blowing
            if (blowDurationRef.current > 0.20) {
              setCandleStates((prev) => {
                const nextStates = [...prev];
                const litIndex = nextStates.findIndex(lit => lit === true);
                if (litIndex !== -1) {
                  nextStates[litIndex] = false;
                  birthdayAudio.playBlowWind();
                  blowDurationRef.current = 0;
                }
                return nextStates;
              });
            }
          } else {
            setIsBlowing(false);
            blowDurationRef.current = Math.max(0, blowDurationRef.current - delta * 2);
          }

          animationFrameIdRef.current = requestAnimationFrame(checkVolumeLoop);
        };

        lastFrameTimeRef.current = Date.now();
        animationFrameIdRef.current = requestAnimationFrame(checkVolumeLoop);

      } catch (err) {
        console.error("Microphone access denied: ", err);
        setMicPermissionDenied(true);
        setMicEnabled(false);
      }
    };

    startMic();

    return () => {
      cleanupMic();
    };
  }, [step, micEnabled, isAllBlown]);

  // Watch for all candles blown out
  useEffect(() => {
    if (candleStates.length > 0 && candleStates.every(state => state === false) && !isAllBlown) {
      triggerSuccessCelebration();
    }
  }, [candleStates, isAllBlown]);

  const cleanupMic = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setVolume(0);
    setIsBlowing(false);
    blowDurationRef.current = 0;
  };

  const triggerSuccessCelebration = () => {
    setIsAllBlown(true);
    birthdayAudio.stopMelody();
    
    // Play celebratory sounds
    birthdayAudio.playBlowWind();
    setTimeout(() => {
      birthdayAudio.playCheer();
    }, 200);

    // Continuous confetti loop
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleStartCelebration = ({ name, age, flavor }) => {
    setUserData({ name, age, flavor });
    setFlavor(flavor);
    setCandleCount(age);
    setStep('celebrate');
    
    birthdayAudio.init();
    birthdayAudio.playMagicSweep();
    
    setTimeout(() => {
      if (musicPlaying) {
        birthdayAudio.startMelody();
      }
    }, 800);
  };

  const handleCandleClick = (index) => {
    if (isAllBlown) return;
    
    setCandleStates((prev) => {
      const nextStates = [...prev];
      const nextState = !nextStates[index];
      nextStates[index] = nextState;
      
      if (nextState) {
        birthdayAudio.playChime(440, birthdayAudio.ctx.currentTime, 0.3);
      } else {
        birthdayAudio.playBlowWind();
      }
      
      return nextStates;
    });
  };

  const handleReset = () => {
    setCandleStates(Array(candleCount).fill(true));
    setIsAllBlown(false);
    birthdayAudio.playMagicSweep();
    setTimeout(() => {
      if (musicPlaying) {
        birthdayAudio.startMelody();
      }
    }, 1000);
  };

  return (
    <div className="app-main-wrapper">
      {/* Sparkly background stars */}
      <div className="stardust-bg" />

      {/* Floating balloons background */}
      <Balloons active={step === 'celebrate'} count={6} />

      {/* Welcome Screen Cover */}
      {step === 'welcome' && (
        <WelcomeScreen onStart={handleStartCelebration} />
      )}

      {/* Celebration Stage */}
      {step === 'celebrate' && (
        <>
          {/* Header controls */}
          <header className="app-header">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-row flex-center"
              style={{ gap: '8px' }}
            >
              <h1 style={{ 
                fontSize: '1.6rem', 
                fontWeight: 800, 
                fontFamily: 'var(--font-cursive)',
                background: 'linear-gradient(135deg, #fbbf24, #f472b6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Happy Birthday! 🎈
              </h1>
            </motion.div>

            {/* Mic Visualizer and Controls */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-row flex-center"
              style={{ gap: '12px' }}
            >
              <AudioVisualizer 
                volume={volume} 
                isActive={micEnabled} 
                isPermissionDenied={micPermissionDenied} 
              />

              <button
                onClick={() => setMusicPlaying(!musicPlaying)}
                className="btn-icon"
                title={musicPlaying ? "Mute Music" : "Play Music"}
              >
                {musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="btn-icon"
                title="Customize Cake"
              >
                <Settings size={18} />
              </button>
            </motion.div>
          </header>

          {/* Central Birthday Cake Stage */}
          <main className="main-stage">
            
            {/* Title Banner */}
            <div className="title-banner">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <h2 style={{ fontSize: '1.2rem', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' }}>
                  Make a Wish,
                </h2>
                <h1 style={{ 
                  fontSize: '2.8rem', 
                  fontWeight: 800, 
                  fontFamily: 'var(--font-fun)',
                  background: 'linear-gradient(135deg, #fbbf24, #ec4899, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
                  letterSpacing: '0.5px'
                }}>
                  {userData.name.toUpperCase()}
                </h1>
              </motion.div>
            </div>

            {/* Cake Component */}
            <Cake
              flavor={flavor}
              candleCount={candleCount}
              candleStates={candleStates}
              onCandleClick={handleCandleClick}
              showSprinkles={showSprinkles}
              showCherries={showCherries}
              isBlowing={isBlowing}
            />

            {/* Instruction Banner */}
            <div style={{ marginTop: '24px', textAlign: 'center', maxWidth: '300px' }}>
              <p style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 500, lineHeight: '1.5' }}>
                {isAllBlown ? (
                  <span style={{ color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    ✨ Your wish is on its way! ✨
                  </span>
                ) : micEnabled ? (
                  "💨 Blow onto your microphone to blow out the candles, or click them directly!"
                ) : (
                  "🖱️ Click on the candles to blow them out!"
                )}
              </p>
            </div>

            {/* Direct action fallbacks */}
            {!isAllBlown && (
              <div className="flex-row flex-center mt-6" style={{ gap: '12px' }}>
                <button
                  onClick={() => setCandleStates(Array(candleCount).fill(false))}
                  className="glass-btn secondary"
                  style={{ padding: '8px 18px', fontSize: '11px', borderRadius: '10px' }}
                >
                  💨 Blow Out All
                </button>
                <button
                  onClick={handleReset}
                  className="glass-btn secondary"
                  style={{ padding: '8px 18px', fontSize: '11px', borderRadius: '10px' }}
                >
                  <RefreshCw size={11} style={{ marginRight: '4px' }} /> Re-light
                </button>
              </div>
            )}
          </main>

          {/* Footer branding */}
          <footer style={{ padding: '20px 0', fontSize: '11px', color: '#4b5563', zIndex: 10, userSelect: 'none', textAlign: 'center' }}>
            Pop the floating balloons for extra fun! 🎈
          </footer>

          {/* Celebration Greeting Popup */}
          <AnimatePresence>
            {isAllBlown && (
              <CelebrationCard
                name={userData.name}
                age={userData.age}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>

          {/* Settings Drawer Panel */}
          <AnimatePresence>
            {settingsOpen && (
              <div className="settings-overlay">
                <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }} onClick={() => setSettingsOpen(false)} />
                
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="settings-drawer"
                >
                  <div>
                    {/* Header */}
                    <div className="drawer-header">
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={18} style={{ color: '#fbbf24' }} /> Customize Cake
                      </h3>
                      <button 
                        onClick={() => setSettingsOpen(false)}
                        className="btn-close"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Options content */}
                    <div className="drawer-content">
                      {/* Name input */}
                      <div className="form-group">
                        <label className="form-label">Birthday Star's Name</label>
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                          className="form-input"
                        />
                      </div>

                      {/* Candle count slider */}
                      <div className="form-group">
                        <div className="flex-between" style={{ marginBottom: '6px' }}>
                          <label className="form-label">Candles</label>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24' }}>{candleCount}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={candleCount}
                          onChange={(e) => setCandleCount(parseInt(e.target.value))}
                          className="range-slider"
                        />
                      </div>

                      {/* Flavor selector */}
                      <div className="form-group">
                        <label className="form-label">Cake Flavor</label>
                        <div className="grid-2">
                          {['chocolate', 'strawberry', 'vanilla', 'redvelvet'].map((flv) => (
                            <button
                              key={flv}
                              onClick={() => setFlavor(flv)}
                              className="form-select"
                              style={{
                                padding: '10px',
                                fontSize: '12px',
                                textAlign: 'center',
                                border: flavor === flv ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
                                background: flavor === flv ? 'rgba(251, 191, 36, 0.08)' : '#0d0a1a',
                                color: flavor === flv ? '#fbbf24' : '#9ca3af',
                                textTransform: 'capitalize'
                              }}
                            >
                              {flv === 'redvelvet' ? 'Red Velvet' : flv}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Microphone toggle */}
                      <div className="flex-between">
                        <div>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Microphone Mode</label>
                          <span style={{ fontSize: '10px', color: '#6b7280', display: 'block' }}>Voice blow detection</span>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={micEnabled}
                            onChange={(e) => setMicEnabled(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      {/* Sprinkles toggle */}
                      <div className="flex-between">
                        <div>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Sprinkles</label>
                          <span style={{ fontSize: '10px', color: '#6b7280', display: 'block' }}>Enable toppings</span>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={showSprinkles}
                            onChange={(e) => setShowSprinkles(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      {/* Cherries toggle */}
                      <div className="flex-between">
                        <div>
                          <label style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Cherries</label>
                          <span style={{ fontSize: '10px', color: '#6b7280', display: 'block' }}>Add cherries</span>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={showCherries}
                            onChange={(e) => setShowCherries(e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="glass-btn w-full flex-center"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Apply Settings
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default App;
