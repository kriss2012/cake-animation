import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, RotateCcw } from 'lucide-react';

const WISHES = [
  "Wishing you a day filled with laughter, love, and endless slices of cake! May all your wildest dreams come true.",
  "Here's to another year of being absolutely fabulous! May your year ahead be as bright and wonderful as you are.",
  "Happy Birthday! May your day be packed with sweet moments, magical surprises, and the people who make you smile.",
  "Count your life by smiles, not tears. Count your age by friends, not years. Have the happiest of birthdays!",
  "A birthday is a new beginning, a clean slate, and the perfect time to chase new dreams. Go conquer the world!",
  "Hope your special day is sweet, beautiful, and absolutely unforgettable. You deserve the absolute best!"
];

const CelebrationCard = ({ name, age, onReset }) => {
  const wish = useMemo(() => {
    const seed = name.length + age;
    return WISHES[seed % WISHES.length];
  }, [name, age]);

  return (
    <div className="celebration-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        className="glass-panel max-w-md w-full p-8 text-center relative overflow-hidden"
      >
        {/* Magic background glow spots */}
        <div 
          className="absolute rounded-full blur-2xl opacity-20 animate-pulse pointer-events-none"
          style={{
            top: '-20px',
            left: '-20px',
            width: '120px',
            height: '120px',
            backgroundColor: '#ec4899'
          }}
        />
        <div 
          className="absolute rounded-full blur-2xl opacity-20 animate-pulse pointer-events-none"
          style={{
            bottom: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            backgroundColor: '#fbbf24'
          }}
        />

        {/* Icon wrapper */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex-center"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            margin: '0 auto 24px auto'
          }}
        >
          <Gift size={30} />
        </motion.div>

        <h2 
          className="text-center" 
          style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            marginBottom: '4px', 
            letterSpacing: '-0.5px',
            color: '#fff'
          }}
        >
          Happy Birthday,
        </h2>
        <h3 
          className="text-center animate-pulse" 
          style={{ 
            fontSize: '3.2rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-cursive)',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #fbbf24, #f472b6, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}
        >
          {name}! 🎉
        </h3>

        {/* Wish Quotation Box */}
        <div 
          className="relative text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px 20px',
            marginBottom: '28px',
          }}
        >
          <Sparkles className="absolute text-amber-400/30" size={14} style={{ top: '12px', left: '12px', color: 'rgba(251, 191, 36, 0.3)' }} />
          <Sparkles className="absolute text-pink-400/30" size={14} style={{ bottom: '12px', right: '12px', color: 'rgba(236, 72, 153, 0.3)' }} />
          <p 
            style={{ 
              color: '#f3f4f6', 
              lineHeight: '1.6', 
              fontWeight: 500, 
              fontSize: '15px', 
              fontStyle: 'italic'
            }}
          >
            "{wish}"
          </p>
        </div>

        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', fontWeight: 600 }}>
          🎈 You are officially <span style={{ color: '#fbbf24', fontWeight: 800 }}>{age}</span> years of awesomeness today!
        </div>

        <button
          onClick={onReset}
          className="glass-btn flex-center w-full"
          style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
        >
          <RotateCcw size={16} /> Make Another Wish
        </button>
      </motion.div>
    </div>
  );
};

export default CelebrationCard;
