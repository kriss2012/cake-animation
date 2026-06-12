import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Check, ChevronRight } from 'lucide-react';
import CakeScene from '../components/cake/CakeScene';
import { useCakeStore } from '../store/cakeStore';
import { api } from '../lib/api';
import { birthdayAudio } from '../utils/audio';

const FLAVORS = [
  { id: 'chocolate', name: 'Chocolate Fudge', color: '#4a2c27', desc: 'Deep rich cocoa frosting' },
  { id: 'strawberry', name: 'Strawberry Cream', color: '#ff8ca3', desc: 'Sweet pink berry frosting' },
  { id: 'vanilla', name: 'Classic Vanilla', color: '#eddcc4', desc: 'Whipped vanilla bean frosting' },
  { id: 'redvelvet', name: 'Red Velvet', color: '#8c0c13', desc: 'Cream cheese with deep cocoa' }
];

export default function Create() {
  const navigate = useNavigate();
  
  // Connect Zustand store
  const { 
    recipientName, setRecipientName,
    message, setMessage,
    frostingColor, setFrostingColor,
    decorations, toggleDecoration,
    setCakeId, reset
  } = useCakeStore();

  const [step, setStep] = useState(1); // 1: Name, 2: Flavor, 3: Message, 4: Decorations
  const [selectedFlavor, setSelectedFlavor] = useState('chocolate');
  const [loading, setLoading] = useState(false);

  // Initialize and reset store on mount
  useEffect(() => {
    reset();
  }, []);

  const handleFlavorChange = (flv) => {
    setSelectedFlavor(flv);
    // Map flavor ID to frosting colors
    const themeColors = {
      chocolate: '#281512',
      strawberry: '#b81232',
      vanilla: '#fffdf2',
      redvelvet: '#f7f6f0'
    };
    setFrostingColor(themeColors[flv]);
  };

  const handleBakeCake = async () => {
    setLoading(true);
    try {
      birthdayAudio.playMagicSweep();
      const cake = await api.post('/cakes', {
        recipientName,
        message,
        frostingColor,
        decorations,
        candleColor: '#FFD700'
      });
      
      setCakeId(cake.id);
      navigate(`/cake/${cake.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to bake cake. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100vw', background: '#0a0814', position: 'relative', flexWrap: 'wrap' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="btn-icon"
        style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100 }}
      >
        <ArrowLeft size={18} />
      </button>

      {/* Left side: WebGL 3D Preview (takes 55% width) */}
      <div 
        style={{ 
          flex: '1 1 500px', 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {/* Soft radial background glow behind cake */}
        <div 
          className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{
            width: '400px',
            height: '400px',
            backgroundColor: selectedFlavor === 'strawberry' ? '#ec4899' : selectedFlavor === 'redvelvet' ? '#8c0c13' : '#a855f7',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        />

        <div style={{ width: '100%', height: '100%', zIndex: 2 }}>
          <CakeScene
            flavor={selectedFlavor}
            candles={[]} // No candles during configuration step
            showSprinkles={decorations.sprinkles}
            showCherries={decorations.sprinkles} // map cherries to same or custom
            recipientName={recipientName}
            interactive={true}
          />
        </div>
      </div>

      {/* Right side: Configuration panel (takes 45% width) */}
      <div 
        style={{ 
          flex: '1 1 420px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '24px',
          background: 'rgba(5, 3, 10, 0.45)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(30px)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          
          {/* Customizer steps header */}
          <div className="flex-row flex-center mb-6" style={{ gap: '6px', justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>
              Baking customizer — Step {step} of 4
            </span>
          </div>

          <AnimatePresence mode="wait">
            
            {/* Step 1: Who is this cake for? */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-column"
              >
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>
                  Who's the Birthday Star? 🌟
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                  Their name will be written in cursive frosting on the top tier of the 3D cake.
                </p>

                <div className="form-group">
                  <label className="form-label">Recipient's Name</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Enter name (e.g. David)"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value.slice(0, 10))}
                    className="form-input"
                  />
                  <span style={{ fontSize: '11px', color: '#555', marginTop: '6px', display: 'block', textAlign: 'right' }}>
                    {recipientName.length}/10 letters
                  </span>
                </div>

                <button
                  disabled={!recipientName.trim()}
                  onClick={() => setStep(2)}
                  className="glass-btn w-full flex-center mt-4"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Choose Flavor <ChevronRight size={16} />
                </button>
              </motion.div>
            )}

            {/* Step 2: Choose Cake Flavor */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-column"
              >
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>
                  Choose a Cake Flavor 🍰
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                  This changes the visual colors of the tiers and frosting message in the scene.
                </p>

                <div className="flex-column" style={{ gap: '12px', marginBottom: '24px' }}>
                  {FLAVORS.map((flv) => (
                    <div
                      key={flv.id}
                      onClick={() => handleFlavorChange(flv.id)}
                      className="glass-panel"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        background: selectedFlavor === flv.id ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
                        borderColor: selectedFlavor === flv.id ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div 
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          backgroundColor: flv.color,
                          border: '2px solid rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {selectedFlavor === flv.id && <Check size={14} style={{ color: '#fff' }} />}
                      </div>
                      
                      <div className="flex-column" style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{flv.name}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{flv.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid-2">
                  <button className="glass-btn secondary" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button className="glass-btn" onClick={() => setStep(3)}>
                    Write Greeting
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Write Custom Greeting */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-column"
              >
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>
                  Write a Birthday Card 📝
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                  Write a heartfelt message to display alongside your cake model on the shareable page.
                </p>

                <div className="form-group">
                  <label className="form-label">Greeting Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Wishing you a beautiful day filled with joy, slices of cake, and magical moments! Happy Birthday!"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="form-input"
                    style={{ resize: 'none', height: '110px' }}
                  />
                  <span style={{ fontSize: '11px', color: '#555', marginTop: '6px', display: 'block', textAlign: 'right' }}>
                    {message.length} characters
                  </span>
                </div>

                <div className="grid-2">
                  <button className="glass-btn secondary" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button 
                    disabled={!message.trim()}
                    className="glass-btn" 
                    onClick={() => setStep(4)}
                  >
                    Decorations
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Toppings & Bake Cake */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-column"
              >
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>
                  Toppings & Details ✨
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                  Add final touches: scattered sugar sprinkles, glazed cherries, and details to your cake.
                </p>

                {/* Sprinkles toggle */}
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Sugar Sprinkles</label>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Scattered colored particles</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={decorations.sprinkles}
                      onChange={() => toggleDecoration('sprinkles')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Cherries toggle */}
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderRadius: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Glazed Cherries</label>
                    <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>Topping layers with stems</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={decorations.stars} // mapping stars to cherries
                      onChange={() => toggleDecoration('stars')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="grid-2">
                  <button className="glass-btn secondary" onClick={() => setStep(3)}>
                    Back
                  </button>
                  <button 
                    disabled={loading}
                    className="glass-btn" 
                    onClick={handleBakeCake}
                  >
                    {loading ? 'Baking...' : 'Bake 3D Cake 🎂'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
