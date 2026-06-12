# BirthdayCake Clone — Complete Implementation Guide

> Build a virtual birthday cake creation & sharing platform (like bdaycake.com) from scratch.

---

## 1. Product Overview

**What the app does:**
- Users create a virtual 3D birthday cake
- Customize it: frosting color, decorations, candles, personalized message
- Generate a shareable link
- Friends/family visit the link, add their own candle + wish
- Creator can "blow out" candles and read all wishes

**Core user flows:**
1. **Creator flow** → Land → Create Cake → Customize → Share link
2. **Wisher flow** → Click shared link → Add candle + message → Submit
3. **Celebration flow** → Creator opens cake → See all candles → Blow out

---

## 2. Tech Stack

### Frontend
| Layer | Technology | Reason |
|---|---|---|
| 3D Rendering | **Three.js** | WebGL-based; used by bdaycake.com itself |
| Framework | **React + Vite** | Fast dev, component-based |
| Styling | **Tailwind CSS** | Utility-first, responsive |
| Animation | **GSAP** | Smooth 3D/UI transitions |
| State | **Zustand** | Lightweight global state |
| Routing | **React Router v6** | SPA routing |

### Backend
| Layer | Technology |
|---|---|
| Runtime | **Node.js + Express** |
| Database | **PostgreSQL** (via Supabase or Railway) |
| ORM | **Prisma** |
| Auth | **Supabase Auth** (Google OAuth + magic link) |
| File Storage | **Supabase Storage** (cake screenshots) |
| Realtime | **Supabase Realtime** (live candle updates) |

### Deployment
- Frontend: **Vercel**
- Backend: **Railway** or **Render**
- DB: **Supabase** (free tier works)

---

## 3. Project Structure

```
bdaycake-clone/
├── frontend/
│   ├── public/
│   │   └── sounds/         # birthday music, candle blow SFX
│   ├── src/
│   │   ├── components/
│   │   │   ├── cake/
│   │   │   │   ├── CakeScene.jsx       # Three.js canvas
│   │   │   │   ├── CakeModel.jsx       # 3D cake geometry
│   │   │   │   ├── Candle.jsx          # Individual candle + flame
│   │   │   │   ├── Frosting.jsx        # Frosting layer
│   │   │   │   └── Decorations.jsx     # Stars, sprinkles etc.
│   │   │   ├── ui/
│   │   │   │   ├── ColorPicker.jsx
│   │   │   │   ├── MessageEditor.jsx
│   │   │   │   ├── ShareModal.jsx
│   │   │   │   ├── WishCard.jsx
│   │   │   │   └── PricingModal.jsx
│   │   │   └── layout/
│   │   │       ├── Header.jsx
│   │   │       └── LandingPage.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing / create cake
│   │   │   ├── Create.jsx         # Cake customizer
│   │   │   ├── Cake.jsx           # Shareable cake view (/cake/:id)
│   │   │   └── Dashboard.jsx      # User's cakes list
│   │   ├── store/
│   │   │   └── cakeStore.js       # Zustand store
│   │   ├── hooks/
│   │   │   ├── useCakeScene.js
│   │   │   └── useAuth.js
│   │   ├── lib/
│   │   │   ├── api.js             # API client
│   │   │   └── supabase.js        # Supabase client
│   │   └── App.jsx
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   │   ├── cakes.js
│   │   │   ├── wishes.js
│   │   │   └── auth.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatar    String?
  plan      Plan     @default(FREE)
  cakes     Cake[]
  wishes    Wish[]
  createdAt DateTime @default(now())
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

model Cake {
  id            String   @id @default(cuid())  // short, shareable
  ownerId       String
  owner         User     @relation(fields: [ownerId], references: [id])
  recipientName String
  message       String   @db.Text
  frostingColor String   @default("#F4A0B4")
  decorations   Json     @default("{}")        // {sprinkles, stars, type}
  candleColor   String   @default("#FFD700")
  isPublic      Boolean  @default(true)
  wishes        Wish[]
  viewCount     Int      @default(0)
  createdAt     DateTime @default(now())
  expiresAt     DateTime?
}

model Wish {
  id        String   @id @default(uuid())
  cakeId    String
  cake      Cake     @relation(fields: [cakeId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  guestName String?
  message   String   @db.Text
  candleColor String @default("#FFD700")
  emoji     String   @default("🕯️")
  createdAt DateTime @default(now())
}
```

---

## 5. Backend API (Express)

### Setup

```bash
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client cors dotenv uuid
npm install -D nodemon
```

### `src/index.js`

```javascript
import express from 'express';
import cors from 'cors';
import cakesRouter from './routes/cakes.js';
import wishesRouter from './routes/wishes.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.use('/api/cakes', cakesRouter);
app.use('/api/wishes', wishesRouter);

app.listen(3001, () => console.log('API running on :3001'));
```

### `src/routes/cakes.js`

```javascript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
const prisma = new PrismaClient();

// Create a cake
router.post('/', authMiddleware, async (req, res) => {
  const { recipientName, message, frostingColor, decorations, candleColor } = req.body;
  const cake = await prisma.cake.create({
    data: {
      ownerId: req.user.id,
      recipientName,
      message,
      frostingColor,
      decorations,
      candleColor,
    }
  });
  res.json(cake);
});

// Get a cake by ID (public)
router.get('/:id', async (req, res) => {
  const cake = await prisma.cake.findUnique({
    where: { id: req.params.id },
    include: { wishes: { include: { user: true }, orderBy: { createdAt: 'desc' } } }
  });
  if (!cake) return res.status(404).json({ error: 'Cake not found' });
  
  // Increment view count
  await prisma.cake.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } });
  
  res.json(cake);
});

// Get user's cakes
router.get('/', authMiddleware, async (req, res) => {
  const cakes = await prisma.cake.findMany({
    where: { ownerId: req.user.id },
    include: { _count: { select: { wishes: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(cakes);
});

export default router;
```

### `src/routes/wishes.js`

```javascript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Add a wish/candle to a cake
router.post('/', async (req, res) => {
  const { cakeId, guestName, message, candleColor, emoji } = req.body;
  
  // Check wish limit (free: 25 wishes per cake)
  const count = await prisma.wish.count({ where: { cakeId } });
  if (count >= 25) return res.status(403).json({ error: 'Candle limit reached' });

  const wish = await prisma.wish.create({
    data: { cakeId, guestName, message, candleColor, emoji }
  });
  res.json(wish);
});

export default router;
```

---

## 6. Frontend — Three.js Cake Scene

### Install dependencies

```bash
cd frontend
npm create vite@latest . -- --template react
npm install three @react-three/fiber @react-three/drei gsap zustand
npm install react-router-dom @supabase/supabase-js
```

### `src/components/cake/CakeScene.jsx`

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import CakeModel from './CakeModel';
import { useCakeStore } from '../../store/cakeStore';

export default function CakeScene({ interactive = true }) {
  const { frostingColor, decorations, wishes } = useCakeStore();

  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[0, 5, 0]} angle={0.3} penumbra={1} intensity={0.8} castShadow />
      
      <CakeModel
        frostingColor={frostingColor}
        decorations={decorations}
        candles={wishes}
      />
      
      <Environment preset="sunset" />
      {interactive && <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} />}
    </Canvas>
  );
}
```

### `src/components/cake/CakeModel.jsx`

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Candle from './Candle';

export default function CakeModel({ frostingColor, candles = [] }) {
  const groupRef = useRef();

  // Gentle float animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Bottom tier */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.8, 32]} />
        <meshStandardMaterial color="#F9D5A7" roughness={0.8} />
      </mesh>

      {/* Top tier */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.7, 32]} />
        <meshStandardMaterial color="#F9D5A7" roughness={0.8} />
      </mesh>

      {/* Frosting layer - bottom */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[1.55, 1.5, 0.15, 32]} />
        <meshStandardMaterial color={frostingColor} roughness={0.6} />
      </mesh>

      {/* Frosting layer - top */}
      <mesh position={[0, 0.68, 0]}>
        <cylinderGeometry args={[1.05, 1.0, 0.12, 32]} />
        <meshStandardMaterial color={frostingColor} roughness={0.6} />
      </mesh>

      {/* Candles arranged in a circle */}
      {candles.slice(0, 25).map((wish, i) => {
        const angle = (i / Math.max(candles.length, 6)) * Math.PI * 2;
        const radius = candles.length <= 6 ? 0.5 : 0.7;
        return (
          <Candle
            key={wish.id || i}
            position={[
              Math.cos(angle) * radius,
              0.75,
              Math.sin(angle) * radius,
            ]}
            color={wish.candleColor || '#FFD700'}
          />
        );
      })}
    </group>
  );
}
```

### `src/components/cake/Candle.jsx`

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Candle({ position, color = '#FFD700' }) {
  const flameRef = useRef();

  useFrame((state) => {
    if (flameRef.current) {
      // Flicker effect
      const flicker = 1 + Math.sin(state.clock.elapsedTime * 10 + position[0] * 5) * 0.08;
      flameRef.current.scale.set(flicker, flicker, flicker);
    }
  });

  return (
    <group position={position}>
      {/* Candle body */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#FFA500"
          emissive="#FF6000"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Flame light */}
      <pointLight
        position={[0, 0.25, 0]}
        color="#FFA500"
        intensity={0.3}
        distance={0.8}
      />
    </group>
  );
}
```

---

## 7. State Management (Zustand)

### `src/store/cakeStore.js`

```javascript
import { create } from 'zustand';

export const useCakeStore = create((set) => ({
  // Customization
  frostingColor: '#F4A0B4',
  candleColor: '#FFD700',
  recipientName: '',
  message: '',
  decorations: { sprinkles: true, stars: false, hearts: false },

  // Loaded cake data
  wishes: [],
  cakeId: null,

  // Actions
  setFrostingColor: (color) => set({ frostingColor: color }),
  setCandleColor: (color) => set({ candleColor: color }),
  setRecipientName: (name) => set({ recipientName: name }),
  setMessage: (msg) => set({ message: msg }),
  toggleDecoration: (key) => set((s) => ({
    decorations: { ...s.decorations, [key]: !s.decorations[key] }
  })),
  setWishes: (wishes) => set({ wishes }),
  addWish: (wish) => set((s) => ({ wishes: [...s.wishes, wish] })),
  setCakeId: (id) => set({ cakeId: id }),
  reset: () => set({
    frostingColor: '#F4A0B4', candleColor: '#FFD700',
    recipientName: '', message: '', wishes: [], cakeId: null
  }),
}));
```

---

## 8. Key Pages

### Create Page (`src/pages/Create.jsx`)

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CakeScene from '../components/cake/CakeScene';
import { useCakeStore } from '../store/cakeStore';
import { api } from '../lib/api';

const FROSTING_COLORS = ['#F4A0B4', '#A8D8EA', '#FFDAC1', '#B5EAD7', '#C7CEEA', '#FFB7B2'];

export default function CreatePage() {
  const navigate = useNavigate();
  const { frostingColor, setFrostingColor, recipientName, setRecipientName, message, setMessage, setCakeId } = useCakeStore();
  const [step, setStep] = useState(1); // 1: name, 2: frosting, 3: message, 4: preview
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const cake = await api.post('/cakes', { recipientName, message, frostingColor });
      setCakeId(cake.id);
      navigate(`/share/${cake.id}`);
    } catch (err) {
      alert('Failed to create cake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-rose-50">
      {/* 3D Preview */}
      <div className="w-full md:w-1/2 h-64 md:h-full">
        <CakeScene />
      </div>

      {/* Customizer Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 gap-6">
        <h1 className="text-3xl font-bold text-rose-600">Create Your Cake 🎂</h1>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-medium text-gray-700">Who's this cake for?</label>
            <input
              className="border-2 border-rose-200 rounded-xl p-3 text-lg focus:outline-none focus:border-rose-500"
              placeholder="Enter their name..."
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
            <button
              className="bg-rose-500 text-white rounded-xl p-3 font-semibold hover:bg-rose-600 transition disabled:opacity-50"
              disabled={!recipientName.trim()}
              onClick={() => setStep(2)}
            >
              Next →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-medium text-gray-700">Choose frosting color</label>
            <div className="flex gap-3 flex-wrap">
              {FROSTING_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-12 h-12 rounded-full border-4 transition ${frostingColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFrostingColor(c)}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button className="flex-1 border-2 border-rose-300 text-rose-500 rounded-xl p-3" onClick={() => setStep(1)}>← Back</button>
              <button className="flex-1 bg-rose-500 text-white rounded-xl p-3" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-medium text-gray-700">Write a message</label>
            <textarea
              className="border-2 border-rose-200 rounded-xl p-3 h-32 resize-none focus:outline-none focus:border-rose-500"
              placeholder="Happy Birthday! Wishing you all the best..."
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <span className="text-sm text-gray-400 text-right">{message.length}/200</span>
            <div className="flex gap-3">
              <button className="flex-1 border-2 border-rose-300 text-rose-500 rounded-xl p-3" onClick={() => setStep(2)}>← Back</button>
              <button
                className="flex-1 bg-rose-500 text-white rounded-xl p-3 font-semibold disabled:opacity-50"
                disabled={loading}
                onClick={handleCreate}
              >
                {loading ? 'Creating...' : '🎂 Create & Share'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Cake View Page (`src/pages/Cake.jsx`)

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CakeScene from '../components/cake/CakeScene';
import { useCakeStore } from '../store/cakeStore';
import { api } from '../lib/api';

export default function CakePage() {
  const { id } = useParams();
  const { setWishes, addWish, wishes } = useCakeStore();
  const [cake, setCake] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [wishMsg, setWishMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/cakes/${id}`).then((data) => {
      setCake(data);
      setWishes(data.wishes);
    });
  }, [id]);

  const handleAddWish = async () => {
    const wish = await api.post('/wishes', {
      cakeId: id,
      guestName,
      message: wishMsg,
    });
    addWish(wish);
    setSubmitted(true);
  };

  if (!cake) return <div className="flex items-center justify-center h-screen text-rose-500 text-xl">Loading cake... 🎂</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-rose-50 to-pink-100 p-6">
      <h1 className="text-4xl font-bold text-rose-600 mt-6">
        🎂 Happy Birthday, {cake.recipientName}!
      </h1>
      <p className="text-gray-600 mt-2 text-lg text-center max-w-md">{cake.message}</p>

      <div className="w-full max-w-lg h-80 mt-6 rounded-2xl overflow-hidden shadow-xl">
        <CakeScene interactive={true} />
      </div>

      <p className="mt-4 text-rose-500 font-medium">{wishes.length} candles placed 🕯️</p>

      {!submitted ? (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg w-full max-w-md flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-700">Add your candle + wish</h2>
          <input
            className="border-2 border-rose-200 rounded-xl p-3 focus:outline-none focus:border-rose-400"
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
          <textarea
            className="border-2 border-rose-200 rounded-xl p-3 h-24 resize-none focus:outline-none focus:border-rose-400"
            placeholder="Write your birthday wish..."
            maxLength={150}
            value={wishMsg}
            onChange={(e) => setWishMsg(e.target.value)}
          />
          <button
            className="bg-rose-500 text-white rounded-xl p-3 font-semibold hover:bg-rose-600 transition disabled:opacity-50"
            disabled={!guestName.trim() || !wishMsg.trim()}
            onClick={handleAddWish}
          >
            🕯️ Place My Candle
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-2xl">🎉 Your candle is on the cake!</p>
          <p className="text-gray-500 mt-2">Share this link with others too.</p>
          <button
            className="mt-4 bg-rose-500 text-white rounded-xl px-6 py-3"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copy Link
          </button>
        </div>
      )}

      {/* Wish Cards */}
      <div className="mt-8 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
        {wishes.map((wish) => (
          <div key={wish.id} className="bg-white rounded-2xl p-4 shadow-md">
            <p className="font-semibold text-rose-600">{wish.guestName || 'Anonymous'} 🕯️</p>
            <p className="text-gray-600 mt-1">{wish.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 9. Auth Setup (Supabase)

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

```javascript
// src/hooks/useAuth.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const signInWithGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  const signInWithEmail = (email) => supabase.auth.signInWithOtp({ email });
  const signOut = () => supabase.auth.signOut();

  return { user, signInWithGoogle, signInWithEmail, signOut };
}
```

---

## 10. Real-time Candles (Supabase Realtime)

```javascript
// In Cake.jsx — subscribe to new wishes in real-time
useEffect(() => {
  const channel = supabase
    .channel(`cake-${id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'Wish',
      filter: `cakeId=eq.${id}`,
    }, (payload) => {
      addWish(payload.new);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [id]);
```

---

## 11. Sharing & Social Meta Tags

In your `index.html` (or server-rendered with SSR):

```html
<meta property="og:title" content="🎂 Happy Birthday, {name}!" />
<meta property="og:description" content="Add your candle and birthday wish!" />
<meta property="og:image" content="https://yourapp.com/api/og/{cakeId}" />
<meta property="og:url" content="https://yourapp.com/cake/{cakeId}" />
<meta name="twitter:card" content="summary_large_image" />
```

Generate dynamic OG images using **@vercel/og** or **satori**:

```javascript
// api/og/[id].js (Next.js API route or Express endpoint)
import { ImageResponse } from '@vercel/og';

export default async function handler(req) {
  const { id } = req.params;
  const cake = await getCakeFromDB(id);

  return new ImageResponse(
    <div style={{ display: 'flex', background: '#FFF0F3', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
      🎂 Happy Birthday, {cake.recipientName}!
    </div>,
    { width: 1200, height: 630 }
  );
}
```

---

## 12. Pricing Tiers

| Feature | Free | Pro ($8.99) | Enterprise ($49.99) |
|---|---|---|---|
| Cakes per month | 1 | Unlimited | Unlimited |
| Max candles/wishes | 25 | 200 | Unlimited |
| Custom branding | ❌ | ❌ | ✅ |
| Password-protected cakes | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Remove watermark | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

Use **Stripe** for payments:

```bash
npm install stripe @stripe/stripe-js
```

```javascript
// Create checkout session
const session = await stripe.checkout.sessions.create({
  price: 'price_XXXXXXX',
  mode: 'subscription',
  success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
  cancel_url: `${process.env.FRONTEND_URL}/pricing`,
});
```

---

## 13. Performance & Quality Checklist

- [ ] **WebGL fallback** — detect `canvas.getContext('webgl')` and show a static image if unsupported
- [ ] **Loading screen** — show animated preloader while Three.js assets load
- [ ] **Mobile touch controls** — Three.js OrbitControls works with touch, ensure pinch-to-zoom is natural
- [ ] **Sound effects** — candle placement SFX, birthday music toggle (muted by default)
- [ ] **Reduced motion** — respect `prefers-reduced-motion` CSS media query; disable float animations
- [ ] **SEO** — dynamic OG images per cake for social sharing previews
- [ ] **Expiry** — optionally allow cakes to expire after 30 days (free tier)
- [ ] **Abuse prevention** — rate-limit wish submissions per IP (5 wishes/minute)
- [ ] **Screenshot** — use `three.js` renderer `.domElement.toDataURL()` to save a cake image

---

## 14. Environment Variables

```bash
# frontend/.env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxx
VITE_API_URL=http://localhost:3001/api

# backend/.env
DATABASE_URL=postgresql://...
SUPABASE_JWT_SECRET=xxxxxx
STRIPE_SECRET_KEY=sk_live_xxx
FRONTEND_URL=https://yourapp.com
```

---

## 15. Deployment Steps

```bash
# 1. Push to GitHub

# 2. Supabase
#    - Create project at supabase.com
#    - Run prisma migrate: npx prisma db push
#    - Enable Google Auth in Supabase dashboard
#    - Enable Realtime for the "Wish" table

# 3. Deploy backend to Railway
railway login
railway init
railway up

# 4. Deploy frontend to Vercel
vercel login
vercel --prod
```

---

## 16. Recommended Libraries Reference

| Library | Purpose | Install |
|---|---|---|
| `three` | 3D WebGL rendering | `npm i three` |
| `@react-three/fiber` | React wrapper for Three.js | `npm i @react-three/fiber` |
| `@react-three/drei` | Helpers (OrbitControls, etc.) | `npm i @react-three/drei` |
| `gsap` | Smooth animations | `npm i gsap` |
| `zustand` | Global state management | `npm i zustand` |
| `@supabase/supabase-js` | Auth + DB + Realtime | `npm i @supabase/supabase-js` |
| `stripe` | Payments | `npm i stripe` |
| `@vercel/og` | Dynamic OG images | `npm i @vercel/og` |
| `prisma` | ORM | `npm i prisma` |

---

*Happy building! The core app can be built in a weekend. Start with the Three.js cake + sharing flow, then layer in auth and payments.*
