import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cake as CakeIcon, Gift } from 'lucide-react';

const FLAVORS = [
  { id: 'chocolate', name: 'Chocolate', color: '#5c3f37' },
  { id: 'strawberry', name: 'Strawberry', color: '#ff7e95' },
  { id: 'vanilla', name: 'Vanilla', color: '#eddcc4' },
  { id: 'redvelvet', name: 'Red Velvet', color: '#8c0c13' }
];

const WelcomeScreen = ({ onStart }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('3');
  const [flavor, setFlavor] = useState('chocolate');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onStart({ name: name.trim(), age: parseInt(age) || 3, flavor });
  };

  return (
    <div className="center-container">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass-panel max-w-md w-full p-8 text-center relative overflow-hidden"
      >
        {/* Decorative corner glows */}
        <div 
          className="absolute rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{
            top: '-60px',
            left: '-60px',
            width: '180px',
            height: '180px',
            backgroundColor: '#a855f7'
          }}
        />
        <div 
          className="absolute rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{
            bottom: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            backgroundColor: '#fbbf24'
          }}
        />

        {!isOpen ? (
          <div className="py-6 flex-column flex-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="mb-6 cursor-pointer text-amber-400"
              style={{ color: '#fbbf24' }}
              onClick={() => setIsOpen(true)}
            >
              <Gift size={80} strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 15px rgba(251,191,36,0.4))' }} />
            </motion.div>
            
            <h1 className="mb-3" style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              A Special Invitation
            </h1>
            <p style={{ color: '#9ca3af', marginBottom: '32px', fontSize: '15px', maxWidth: '300px', lineHeight: '1.5' }}>
              We've created a custom, interactive 3D birthday cake for you! Open it to customize the party.
            </p>

            <button 
              onClick={() => setIsOpen(true)}
              className="glass-btn"
            >
              <Sparkles size={18} /> Open Invitation
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex-center mb-4" style={{ color: '#fbbf24' }}>
              <CakeIcon size={44} style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.25))' }} />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.5px' }}>
              Configure Celebration
            </h2>
            
            <form onSubmit={handleSubmit} className="flex-column" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Birthday Star's Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Age (Candles)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={age}
                    onChange={(e) => setAge(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)).toString())}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cake Flavor</label>
                  <select
                    value={flavor}
                    onChange={(e) => setFlavor(e.target.value)}
                    className="form-select"
                  >
                    {FLAVORS.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Flavor Style</label>
                <div className="flavor-selector-container">
                  {FLAVORS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFlavor(f.id)}
                      className={`flavor-pill ${flavor === f.id ? 'active' : ''}`}
                      style={{ 
                        backgroundColor: f.color, 
                      }}
                      title={f.name}
                    >
                      {flavor === f.id && (
                        <div className="flavor-dot" style={{ backgroundColor: f.id === 'vanilla' ? '#4a2c27' : '#fff' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '8px' }}>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="glass-btn w-full flex-center"
                  style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
                >
                  Bake 3D Cake ✨
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
