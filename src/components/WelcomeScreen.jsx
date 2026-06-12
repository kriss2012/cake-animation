import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cake as CakeIcon, Gift } from 'lucide-react';

const FLAVORS = [
  { id: 'chocolate', name: 'Chocolate', color: '#5c3f37' },
  { id: 'strawberry', name: 'Strawberry', color: '#ff8da1' },
  { id: 'vanilla', name: 'Vanilla', color: '#fdf5df' },
  { id: 'redvelvet', name: 'Red Velvet', color: '#8f121a' }
];

const WelcomeScreen = ({ onStart }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('18');
  const [flavor, setFlavor] = useState('chocolate');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onStart({ name: name.trim(), age: parseInt(age) || 18, flavor });
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full px-4 relative z-50 overflow-y-auto py-10" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass-panel w-full max-w-md p-8 text-center relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        {!isOpen ? (
          <div className="py-6 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="mb-6 cursor-pointer text-amber-400"
              onClick={() => setIsOpen(true)}
            >
              <Gift size={80} strokeWidth={1.2} className="drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
            </motion.div>
            
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight" style={{ fontFamily: 'var(--font-primary)' }}>
              A Special Delivery
            </h1>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto">
              You have received a magical interactive birthday celebration! Open it to begin.
            </p>

            <button 
              onClick={() => setIsOpen(true)}
              className="glass-btn gap-2"
            >
              <Sparkles size={18} /> Open Gift Box
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center mb-4 text-amber-400">
              <CakeIcon size={44} className="drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
            </div>
            
            <h2 className="text-3xl font-extrabold mb-6 tracking-tight">Configure Celebration</h2>
            
            <form onSubmit={handleSubmit} className="text-left space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Birthday Star's Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  style={{ fontFamily: 'var(--font-primary)', fontSize: '1rem' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Age (Candles)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={age}
                    onChange={(e) => setAge(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)).toString())}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    style={{ fontFamily: 'var(--font-primary)' }}
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Max 10 for layout spacing</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Cake Flavor</label>
                  <select
                    value={flavor}
                    onChange={(e) => setFlavor(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                    style={{ fontFamily: 'var(--font-primary)' }}
                  >
                    {FLAVORS.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Flavor Preview</label>
                <div className="flex gap-3 justify-center bg-white/5 p-3 rounded-xl border border-white/5">
                  {FLAVORS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFlavor(f.id)}
                      className={`w-10 h-10 rounded-full border-2 transition relative flex items-center justify-center`}
                      style={{ 
                        backgroundColor: f.color, 
                        borderColor: flavor === f.id ? '#fbbf24' : 'transparent',
                        transform: flavor === f.id ? 'scale(1.15)' : 'scale(1)'
                      }}
                      title={f.name}
                    >
                      {flavor === f.id && (
                        <span className="absolute w-2 h-2 bg-amber-400 rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full glass-btn justify-center py-3.5 rounded-xl disabled:opacity-50 disabled:pointer-events-none"
                >
                  Create Magic ✨
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
