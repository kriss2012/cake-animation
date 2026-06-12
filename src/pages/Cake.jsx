import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Volume2, VolumeX, Mic, MicOff, RefreshCw, Share2, Sparkles, Plus, Home
} from 'lucide-react';
import CakeScene from '../components/cake/CakeScene';
import Balloons from '../components/Balloons';
import CelebrationCard from '../components/CelebrationCard';
import AudioVisualizer from '../components/AudioVisualizer';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { birthdayAudio } from '../utils/audio';

export default function Cake() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core database retrieved states
  const [cakeData, setCakeData] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [candleStates, setCandleStates] = useState([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isAllBlown, setIsAllBlown] = useState(false);

  // Guest input states
  const [guestName, setGuestName] = useState('');
  const [wishMsg, setWishMsg] = useState('');
  const [candleColor, setCandleColor] = useState('#FFD700');
  const [wishSubmitted, setWishSubmitted] = useState(false);

  // Audio Context tracking refs
  const blowDurationRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const micStreamRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  // Load Initial Cake specs
  useEffect(() => {
    setLoading(true);
    api.get(`/cakes/${id}`)
      .then((data) => {
        setCakeData(data);
        setWishes(data.wishes || []);
        setCandleStates(Array(data.wishes?.length || 0).fill(true));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching cake:', err);
        setLoading(false);
      });
  }, [id]);

  // Real-time listener: listen to additions from other guests
  useEffect(() => {
    if (!id) return;

    if (supabase) {
      // Connect live Postgres changes channel
      const channel = supabase
        .channel(`cake-wishes-${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Wish', filter: `cakeId=eq.${id}` },
          (payload) => {
            const newWish = payload.new;
            setWishes((prev) => {
              // Deduplicate
              if (prev.some(w => w.id === newWish.id)) return prev;
              const next = [...prev, newWish];
              // Light new candle
              setCandleStates(prevStates => [...prevStates, true]);
              return next;
            });
            // Play chime sound
            birthdayAudio.playChime(523, birthdayAudio.ctx.currentTime, 0.4);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Mock local environment event dispatch fallback
      const handleLocalWish = (e) => {
        const newWish = e.detail;
        setWishes((prev) => {
          if (prev.some(w => w.id === newWish.id)) return prev;
          const next = [...prev, newWish];
          setCandleStates(prevStates => [...prevStates, true]);
          return next;
        });
        birthdayAudio.playChime(523, birthdayAudio.ctx.currentTime, 0.4);
      };

      window.addEventListener(`wish_added_${id}`, handleLocalWish);
      return () => {
        window.removeEventListener(`wish_added_${id}`, handleLocalWish);
      };
    }
  }, [id]);

  // Handle ambient background music loops
  useEffect(() => {
    if (musicPlaying && !isAllBlown) {
      birthdayAudio.startMelody();
    } else {
      birthdayAudio.stopMelody();
    }
    return () => {
      birthdayAudio.stopMelody();
    };
  }, [musicPlaying, isAllBlown]);

  useEffect(() => {
    birthdayAudio.setMute(!musicPlaying);
  }, [musicPlaying]);

  // Microphone analytical loop for blow detection
  useEffect(() => {
    if (!micEnabled || isAllBlown || wishes.length === 0) {
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
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        micSource.connect(analyser);

        const checkVolumeLoop = () => {
          if (!analyser || isAllBlown) return;

          analyser.getByteFrequencyData(dataArray);

          let lowFreqSum = 0;
          const binsToCheck = 15;
          for (let i = 0; i < binsToCheck; i++) {
            lowFreqSum += dataArray[i];
          }
          const avgLow = lowFreqSum / binsToCheck;
          const currentVol = Math.min(100, (avgLow / 160) * 100);
          setVolume(currentVol);

          const now = Date.now();
          const delta = (now - lastFrameTimeRef.current) / 1000;
          lastFrameTimeRef.current = now;

          if (currentVol > 35) {
            setIsBlowing(true);
            blowDurationRef.current += delta;

            if (blowDurationRef.current > 0.15) {
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
        console.warn("Microphone not available:", err);
        setMicPermissionDenied(true);
        setMicEnabled(false);
      }
    };

    startMic();

    return () => {
      cleanupMic();
    };
  }, [micEnabled, wishes.length, isAllBlown]);

  // Handle successful blowout trigger
  useEffect(() => {
    if (wishes.length > 0 && candleStates.length > 0 && candleStates.every(lit => lit === false) && !isAllBlown) {
      triggerSuccessCelebration();
    }
  }, [candleStates, wishes, isAllBlown]);

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
  };

  const triggerSuccessCelebration = () => {
    setIsAllBlown(true);
    birthdayAudio.stopMelody();
    birthdayAudio.playBlowWind();
    
    setTimeout(() => {
      birthdayAudio.playCheer();
    }, 200);

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleCandleClick = (index) => {
    if (isAllBlown) return;
    setCandleStates((prev) => {
      const next = [...prev];
      const nextLit = !next[index];
      next[index] = nextLit;
      if (nextLit) {
        birthdayAudio.playChime(440, birthdayAudio.ctx.currentTime, 0.2);
      } else {
        birthdayAudio.playBlowWind();
      }
      return next;
    });
  };

  const handleAddWish = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !wishMsg.trim()) return;

    try {
      birthdayAudio.playMagicSweep();
      const newWish = await api.post('/wishes', {
        cakeId: id,
        guestName: guestName.trim(),
        message: wishMsg.trim(),
        candleColor
      });
      
      setWishes(prev => [...prev, newWish]);
      setCandleStates(prev => [...prev, true]);
      setWishSubmitted(true);
      setGuestName('');
      setWishMsg('');
    } catch (err) {
      console.error(err);
      alert('Failed to place candle. Please try again!');
    }
  };

  const handleResetCandles = () => {
    setCandleStates(Array(wishes.length).fill(true));
    setIsAllBlown(false);
    birthdayAudio.playMagicSweep();
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('🎂 Shared link copied to clipboard! Send it to friends.');
  };

  if (loading) {
    return <div className="center-container" style={{ fontSize: '18px', color: '#fbbf24', fontWeight: 700 }}>Baking 3D scene... 🎂</div>;
  }

  if (!cakeData) {
    return <div className="center-container" style={{ fontSize: '18px', color: '#ff4b4b' }}>Cake not found in database!</div>;
  }

  return (
    <div className="app-main-wrapper">
      <div className="stardust-bg" />
      <Balloons active={true} count={6} />

      {/* Header section */}
      <header className="app-header">
        <button onClick={() => navigate('/')} className="btn-icon" title="Go Home">
          <Home size={18} />
        </button>

        <div className="flex-row flex-center" style={{ gap: '12px' }}>
          {wishes.length > 0 && (
            <AudioVisualizer 
              volume={volume} 
              isActive={micEnabled} 
              isPermissionDenied={micPermissionDenied} 
            />
          )}

          <button onClick={() => setMusicPlaying(!musicPlaying)} className="btn-icon" title="Toggle Music">
            {musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button onClick={copyShareLink} className="btn-icon" title="Share Cake">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Main stage splits into 3D view and Guest Form */}
      <div 
        style={{ 
          flex: 1, 
          width: '100%', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0 24px 40px 24px', 
          gap: '40px' 
        }}
      >
        {/* Left Side: 3D Canvas viewport */}
        <div style={{ flex: '1 1 500px', height: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Greeting text banner */}
          <div className="text-center mb-4">
            <h2 style={{ fontSize: '1.2rem', color: '#9ca3af', fontWeight: 600 }}>Happy Birthday,</h2>
            <h1 style={{ 
              fontSize: '2.8rem', 
              fontWeight: 800, 
              fontFamily: 'var(--font-fun)',
              background: 'linear-gradient(135deg, #fbbf24, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))'
            }}>
              {cakeData.recipientName.toUpperCase()}!
            </h1>
            <p style={{ color: '#d1d5db', fontSize: '14px', fontStyle: 'italic', maxWidth: '380px', margin: '6px auto 0 auto' }}>
              "{cakeData.message}"
            </p>
          </div>

          <div style={{ width: '100%', height: '340px', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
            <CakeScene
              flavor={cakeData.frostingColor === '#281512' ? 'chocolate' : cakeData.frostingColor === '#b81232' ? 'strawberry' : cakeData.frostingColor === '#fffdf2' ? 'vanilla' : 'redvelvet'}
              candles={wishes}
              candleStates={candleStates}
              onCandleClick={handleCandleClick}
              showSprinkles={cakeData.decorations?.sprinkles !== false}
              showCherries={cakeData.decorations?.stars !== false} // map stars to cherries
              recipientName={cakeData.recipientName}
              interactive={true}
            />
          </div>

          {/* Blowout helper indicator */}
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px', fontWeight: 600 }}>
            🕯️ {wishes.length} candle{wishes.length !== 1 ? 's' : ''} placed on the cake
          </p>
          
          {wishes.length > 0 && !isAllBlown && (
            <div className="flex-row flex-center mt-4" style={{ gap: '12px' }}>
              <button
                onClick={() => setCandleStates(Array(wishes.length).fill(false))}
                className="glass-btn secondary"
                style={{ padding: '8px 18px', fontSize: '11px', borderRadius: '10px' }}
              >
                💨 Blow Out All
              </button>
              <button
                onClick={handleResetCandles}
                className="glass-btn secondary"
                style={{ padding: '8px 18px', fontSize: '11px', borderRadius: '10px' }}
              >
                <RefreshCw size={11} style={{ marginRight: '4px' }} /> Re-light
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Form panel to Add Candle */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!wishSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 flex-column"
              style={{ width: '100%', borderRadius: '24px' }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: '#fff' }}>
                🕯️ Add a Candle + Wish
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '18px', lineHeight: '1.4' }}>
                Type your name, write a birthday message, and watch your candle light up on the cake model!
              </p>

              <form onSubmit={handleAddWish} className="flex-column" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="Guest name..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Birthday Message</label>
                  <textarea
                    rows={3}
                    required
                    maxLength={120}
                    placeholder="Write a sweet birthday wish..."
                    value={wishMsg}
                    onChange={(e) => setWishMsg(e.target.value)}
                    className="form-input"
                    style={{ resize: 'none', height: '80px' }}
                  />
                  <span style={{ fontSize: '10px', color: '#555', display: 'block', textAlign: 'right', marginTop: '4px' }}>
                    {wishMsg.length}/120 characters
                  </span>
                </div>

                {/* Candle color selector */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Choose Candle Color</label>
                  <div className="flex-row" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                    {['#fbbf24', '#f43f5e', '#3b82f6', '#10b981', '#a855f7', '#ffffff'].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCandleColor(col)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: col,
                          border: candleColor === col ? '2px solid #fff' : '2px solid transparent',
                          cursor: 'pointer',
                          boxShadow: candleColor === col ? '0 0 10px ' + col : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!guestName.trim() || !wishMsg.trim()}
                  className="glass-btn w-full flex-center"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={16} /> Place My Candle
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-6 text-center flex-column"
              style={{ width: '100%', borderRadius: '24px', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
                🎉 Candle Placed!
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                Your candle is lit on the 3D cake scene! Invite more friends to place candles and build a giant celebration.
              </p>

              <div className="grid-2">
                <button onClick={() => setWishSubmitted(false)} className="glass-btn secondary" style={{ fontSize: '12px' }}>
                  Write Another
                </button>
                <button onClick={copyShareLink} className="glass-btn" style={{ fontSize: '12px' }}>
                  Copy Link
                </button>
              </div>
            </motion.div>
          )}

          {/* List of Wish Cards */}
          <div style={{ maxHeight: '230px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="custom-scrollbar">
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left' }}>
              Wishes Board
            </h4>

            {wishes.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', textAlign: 'left' }}>
                No wishes added yet. Be the first to place a candle!
              </span>
            ) : (
              wishes.map((w, idx) => (
                <div 
                  key={w.id || idx}
                  className="glass-panel p-3.5"
                  style={{
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    textAlign: 'left'
                  }}
                >
                  <div className="flex-between mb-1">
                    <span style={{ fontSize: '12px', fontWeight: 800, color: w.candleColor || '#fbbf24' }}>
                      {w.guestName}
                    </span>
                    <span style={{ fontSize: '10px', color: '#4b5563' }}>
                      {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' }}>
                    {w.message}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Celebratory Congratulatory overlay card */}
      <AnimatePresence>
        {isAllBlown && (
          <CelebrationCard
            name={cakeData.recipientName}
            age={wishes.length}
            onReset={handleResetCandles}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
