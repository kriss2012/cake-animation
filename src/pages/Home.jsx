import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cake, Sparkles, Share2, Heart, Award, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { birthdayAudio } from '../utils/audio';

export default function Home() {
  const navigate = useNavigate();
  const [myCakes, setMyCakes] = useState([]);

  useEffect(() => {
    // Load previously baked cakes
    api.get('/cakes')
      .then(setMyCakes)
      .catch(err => console.log('Error loading cakes:', err));
  }, []);

  const handleCreateNew = () => {
    birthdayAudio.init();
    birthdayAudio.playMagicSweep();
    navigate('/create');
  };

  return (
    <div className="center-container" style={{ display: 'block', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px 80px 24px' }}>
        
        {/* Hero Banner */}
        <div className="text-center mb-10" style={{ marginTop: '20px' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex-center mb-4 text-amber-400" style={{ color: '#fbbf24' }}>
              <Cake size={64} style={{ filter: 'drop-shadow(0 0 15px rgba(251,191,36,0.3))' }} />
            </div>
            
            <h1 style={{ 
              fontSize: '3.4rem', 
              fontWeight: 800, 
              letterSpacing: '-1px',
              lineHeight: '1.15',
              marginBottom: '16px' 
            }}>
              Virtual 3D Birthday Cakes<br />
              <span style={{
                background: 'linear-gradient(135deg, #fbbf24, #ec4899, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Created by You, Shared with Love.
              </span>
            </h1>
            
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '18px', 
              maxWidth: '550px', 
              margin: '0 auto 36px auto',
              lineHeight: '1.6'
            }}>
              Bake a custom 3D cake, add a personalized frosting message, and share it. Friends can add real-time candles and birthday wishes!
            </p>

            <button
              onClick={handleCreateNew}
              className="glass-btn"
              style={{ fontSize: '15px', padding: '16px 36px', borderRadius: '18px' }}
            >
              Bake a 3D Cake Now <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '60px',
          marginBottom: '60px'
        }}>
          {/* Card 1 */}
          <div className="glass-panel p-6 flex-column" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ color: '#fbbf24', marginBottom: '16px' }}><Sparkles size={28} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Stunning 3D WebGL Cakes</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
              Customize flavors, frosting colors, sprinkles, and toppings. Drag and orbit the cake in full interactive 3D space.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 flex-column" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ color: '#ec4899', marginBottom: '16px' }}><Heart size={28} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Real-time Collaborative Wishes</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
              Send the shared link to friends. They place their own candle and submit a birthday message that updates live on the cake!
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 flex-column" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ color: '#a78bfa', marginBottom: '16px' }}><Award size={28} /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Interactive Blowout Mechanics</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
              The birthday star can blow into their microphone to blow out the virtual candles, triggering confetti fanfares!
            </p>
          </div>
        </div>

        {/* User's Created Cakes List */}
        {myCakes.length > 0 && (
          <div className="glass-panel p-8" style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🍰 Your Baked Cakes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              {myCakes.map((cake) => (
                <div 
                  key={cake.id} 
                  onClick={() => navigate(`/cake/${cake.id}`)}
                  className="glass-panel p-5 cursor-pointer hover-card"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="flex-between mb-3">
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        color: cake.frostingColor,
                        background: 'rgba(255,255,255,0.05)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {cake.id}
                    </span>
                    <Share2 size={14} style={{ color: '#9ca3af' }} />
                  </div>
                  
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px', color: '#fff' }}>
                    {cake.recipientName}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#9ca3af', lineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '36px' }}>
                    {cake.message}
                  </p>
                  
                  <div className="flex-between mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', fontSize: '11px', color: '#6b7280' }}>
                    <span>🕯️ {cake.wishes?.length || 0} placed</span>
                    <span>{new Date(cake.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
