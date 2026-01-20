import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface Driver {
  id: string;
  user_id: string;
  nom: string;
  telephone: string | null;
  email: string;
  vehicule_modele: string | null;
  categorie_vehicule: string | null;
  statut: string;
  est_en_ligne: boolean | null;
  type_covoiturage: string | null;
  mode: string | null;
  created_at: string | null;
}

interface DriverAuthContextType {
  user: Driver | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

export function DriverAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Driver | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadDriverData(newSession?.user?.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function initializeAuth() {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user?.id) {
        await loadDriverData(currentSession.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setLoading(false);
    }
  }

  async function loadDriverData(userId: string | undefined) {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching driver data (non-critical):', error);
      }

      const chauffeur = data?.[0];
      if (chauffeur) {
        setUser(chauffeur);
      } else {
        console.warn('No driver record found for user_id:', userId);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading driver data (non-critical):', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { error: new Error('Email ou mot de passe incorrect') };
      }

      if (authData?.user?.id) {
        await loadDriverData(authData.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <DriverAuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </DriverAuthContext.Provider>
  );
}

export function useDriverAuth() {
  const context = useContext(DriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return context;
}
