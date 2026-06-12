const API_URL = import.meta.env.VITE_API_URL || '';

// In-browser Mock Database fallback
const mockDb = {
  getCake: (id) => {
    const raw = localStorage.getItem(`cake_${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  },
  saveCake: (data) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newCake = {
      id,
      ownerId: 'local-user',
      recipientName: data.recipientName || 'Friend',
      message: data.message || '',
      frostingColor: data.frostingColor || '#F4A0B4',
      decorations: data.decorations || { sprinkles: true, stars: false, hearts: false },
      candleColor: data.candleColor || '#FFD700',
      wishes: [],
      viewCount: 0,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(`cake_${id}`, JSON.stringify(newCake));
    
    // Save list of user's cakes
    const userCakes = JSON.parse(localStorage.getItem('user_cakes') || '[]');
    userCakes.push(id);
    localStorage.setItem('user_cakes', JSON.stringify(userCakes));
    
    return newCake;
  },
  addWish: (data) => {
    const cake = mockDb.getCake(data.cakeId);
    if (!cake) throw new Error('Cake not found');
    
    const newWish = {
      id: Math.random().toString(36).substring(2, 9),
      cakeId: data.cakeId,
      guestName: data.guestName || 'Anonymous',
      message: data.message || '',
      candleColor: data.candleColor || '#FFD700',
      emoji: data.emoji || '🕯️',
      createdAt: new Date().toISOString()
    };
    
    cake.wishes.push(newWish);
    localStorage.setItem(`cake_${data.cakeId}`, JSON.stringify(cake));
    
    // Dispatch custom event to simulate realtime updates locally in same browser!
    window.dispatchEvent(new CustomEvent(`wish_added_${data.cakeId}`, { detail: newWish }));
    
    return newWish;
  },
  getUserCakes: () => {
    const ids = JSON.parse(localStorage.getItem('user_cakes') || '[]');
    return ids.map(id => mockDb.getCake(id)).filter(Boolean);
  }
};

export const api = {
  get: async (endpoint) => {
    if (!API_URL) {
      // Handle local mock routes
      if (endpoint.startsWith('/cakes/')) {
        const id = endpoint.split('/')[2];
        const cake = mockDb.getCake(id);
        if (!cake) throw new Error('Not found');
        return cake;
      }
      if (endpoint === '/cakes') {
        return mockDb.getUserCakes();
      }
      throw new Error('Endpoint not supported in mock mode');
    }

    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error('Network error');
    return response.json();
  },

  post: async (endpoint, body) => {
    if (!API_URL) {
      if (endpoint === '/cakes') {
        return mockDb.saveCake(body);
      }
      if (endpoint === '/wishes') {
        return mockDb.addWish(body);
      }
      throw new Error('Endpoint not supported in mock mode');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Network error');
    return response.json();
  }
};
