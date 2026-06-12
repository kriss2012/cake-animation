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
  // Select a random wish based on name/age so it doesn't change on simple re-renders
  const wish = useMemo(() => {
    const seed = name.length + age;
    return WISHES[seed % WISHES.length];
  }, [name, age]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotateY: 30 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        className="glass-panel w-full max-w-md p-8 text-center relative overflow-hidden"
      >
        {/* Magic lights in background */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-yellow-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 mb-6 border border-amber-400/20"
        >
          <Gift size={32} />
        </motion.div>

        <h2 className="text-4xl font-extrabold mb-1 tracking-tight text-white" style={{ fontFamily: 'var(--font-primary)' }}>
          Happy Birthday,
        </h2>
        <h3 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 mb-4" style={{ fontFamily: 'var(--font-cursive)' }}>
          {name}! 🎉
        </h3>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 relative">
          <Sparkles className="absolute top-3 left-3 text-amber-400/30" size={16} />
          <Sparkles className="absolute bottom-3 right-3 text-pink-400/30" size={16} />
          <p className="text-gray-200 leading-relaxed font-medium text-sm italic">
            "{wish}"
          </p>
        </div>

        <div className="text-sm text-gray-400 mb-6 font-semibold">
          🎈 You are officially <span className="text-amber-400 font-bold">{age}</span> years of awesomeness today!
        </div>

        <button
          onClick={onReset}
          className="glass-btn gap-2 w-full justify-center"
        >
          <RotateCcw size={18} /> Make Another Wish
        </button>
      </motion.div>
    </div>
  );
};

export default CelebrationCard;
