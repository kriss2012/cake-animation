import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Volume2, VolumeX, Mic, MicOff, Settings, X, 
  HelpCircle, Sparkles, Play, Pause, RefreshCw 
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
      // Cleanup microphone if disabled
      cleanupMic();
      return;
    }

    let audioContext = null;
    let micSource = null;
    let analyser = null;
    let dataArray = null;

    const startMic = async () => {
      try {
        // Use the controller's AudioContext
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

          if (currentVol > 30) {
            setIsBlowing(true);
            blowDurationRef.current += delta;

            // Progressive blowout: blow out candles based on duration
            // e.g., blow out a candle every 0.25 seconds of active blowing
            if (blowDurationRef.current > 0.25) {
              setCandleStates((prev) => {
                // Find first lit candle and blow it out
                const nextStates = [...prev];
                const litIndex = nextStates.findIndex(lit => lit === true);
                if (litIndex !== -1) {
                  nextStates[litIndex] = false;
                  // Play a dynamic blow-out chime or sound
                  birthdayAudio.playBlowWind();
                  blowDurationRef.current = 0; // Reset timer for next candle
                }
                return nextStates;
              });
            }
          } else {
            setIsBlowing(false);
            blowDurationRef.current = Math.max(0, blowDurationRef.current - delta * 2); // decay blow charge
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
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti from both sides
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleStartCelebration = ({ name, age, flavor }) => {
    setUserData({ name, age, flavor });
    setFlavor(flavor);
    setCandleCount(age);
    setStep('celebrate');
    
    // Initialize & Play audio
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
      
      // Play a short synth chime feedback when lighting/extinguishing
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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden">
      {/* Sparkly / starry background stars */}
      <div className="stardust-bg" />

      {/* Floating balloons background */}
      <Balloons active={step === 'celebrate'} count={5} />

      {/* Welcome Screen Cover */}
      {step === 'welcome' && (
        <WelcomeScreen onStart={handleStartCelebration} />
      )}

      {/* Celebration Stage */}
      {step === 'celebrate' && (
        <>
          {/* Header controls */}
          <header className="w-full max-w-5xl px-6 py-4 flex items-center justify-between z-40 relative">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-500" style={{ fontFamily: 'var(--font-cursive)' }}>
                Happy Birthday! 🎈
              </h1>
            </motion.div>

            {/* Mic Visualizer and Controls */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <AudioVisualizer 
                volume={volume} 
                isActive={micEnabled} 
                isPermissionDenied={micPermissionDenied} 
              />

              <button
                onClick={() => setMusicPlaying(!musicPlaying)}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition"
                title={musicPlaying ? "Mute Music" : "Play Music"}
              >
                {musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition"
                title="Customize Cake"
              >
                <Settings size={18} />
              </button>
            </motion.div>
          </header>

          {/* Central Birthday Cake Stage */}
          <main className="flex-1 flex flex-col items-center justify-center w-full max-w-lg px-6 z-30">
            
            {/* Title / Name Banner */}
            <div className="text-center mb-10 select-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                <h2 className="text-3xl font-bold text-gray-300 mb-1" style={{ fontFamily: 'var(--font-primary)' }}>
                  A Wish for
                </h2>
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" style={{ fontFamily: 'var(--font-fun)' }}>
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
            <div className="mt-8 text-center max-w-xs">
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                {isAllBlown ? (
                  <span className="text-amber-400 font-bold flex items-center justify-center gap-1.5 animate-bounce">
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
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setCandleStates(Array(candleCount).fill(false))}
                  className="glass-btn secondary py-2 px-5 text-xs rounded-xl"
                >
                  💨 Blow Out All
                </button>
                <button
                  onClick={handleReset}
                  className="glass-btn secondary py-2 px-5 text-xs rounded-xl"
                >
                  <RefreshCw size={12} className="mr-1" /> Re-light All
                </button>
              </div>
            )}
          </main>

          {/* Footer branding */}
          <footer className="py-6 text-center text-xs text-gray-600 z-10 select-none">
            Click floating balloons to pop them! 🎈
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

          {/* Customizer Slider Settings Panel (Drawer) */}
          <AnimatePresence>
            {settingsOpen && (
              <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
                {/* Backdrop closer */}
                <div className="absolute inset-0" onClick={() => setSettingsOpen(false)} />
                
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="relative w-80 h-full bg-[#110e20] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings size={18} className="text-amber-400" /> Customize Party
                      </h3>
                      <button 
                        onClick={() => setSettingsOpen(false)}
                        className="p-1 rounded-full text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Options list */}
                    <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1 max-h-[calc(100vh-180px)]">
                      {/* Name input */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Birthday Name</label>
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Candle count slider */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Candles</label>
                          <span className="text-sm font-bold text-amber-400">{candleCount}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={candleCount}
                          onChange={(e) => setCandleCount(parseInt(e.target.value))}
                          className="w-full accent-amber-400 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Flavor selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Cake Flavor</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['chocolate', 'strawberry', 'vanilla', 'redvelvet'].map((flv) => (
                            <button
                              key={flv}
                              onClick={() => setFlavor(flv)}
                              className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition ${
                                flavor === flv 
                                  ? 'border-amber-400 bg-amber-400/10 text-white' 
                                  : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {flv === 'redvelvet' ? 'Red Velvet' : flv}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Microphone toggle */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <label className="block text-sm font-semibold text-white">Microphone Mode</label>
                          <span className="text-[10px] text-gray-500">Enable voice blowing</span>
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
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <label className="block text-sm font-semibold text-white">Sprinkles</label>
                          <span className="text-[10px] text-gray-500">Enable colorful sprinkles</span>
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
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <label className="block text-sm font-semibold text-white">Cherries</label>
                          <span className="text-[10px] text-gray-500">Enable cake cherry toppings</span>
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

                  {/* Close button at bottom */}
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="w-full glass-btn justify-center py-3 rounded-xl mt-4"
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
