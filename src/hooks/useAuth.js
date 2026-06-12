import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // Mock local session for offline development
      setUser({ 
        id: 'local-user', 
        email: 'guest@bdaycake.local', 
        user_metadata: { full_name: 'Local Host' } 
      });
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = () => {
    if (!supabase) {
      alert('Google OAuth requires configuring VITE_SUPABASE_URL in your environment!');
      return;
    }
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signInWithEmail = (email) => {
    if (!supabase) {
      alert('Email OTP requires configuring VITE_SUPABASE_URL in your environment!');
      return;
    }
    return supabase.auth.signInWithOtp({ email });
  };

  const signOut = () => {
    if (!supabase) {
      setUser(null);
      return;
    }
    return supabase.auth.signOut();
  };

  return { user, loading, signInWithGoogle, signInWithEmail, signOut };
}
