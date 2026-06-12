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

  // UI status
  isPlayingMusic: true,
  isMicEnabled: true,
  isMuted: false,

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
  setPlayingMusic: (val) => set({ isPlayingMusic: val }),
  setMicEnabled: (val) => set({ isMicEnabled: val }),
  
  reset: () => set({
    frostingColor: '#F4A0B4',
    candleColor: '#FFD700',
    recipientName: '',
    message: '',
    wishes: [],
    cakeId: null,
    decorations: { sprinkles: true, stars: false, hearts: false },
  }),
}));
