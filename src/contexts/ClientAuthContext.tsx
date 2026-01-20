import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ClientAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, phone: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const isEmail = identifier.includes('@');

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        phone: identifier,
        password,
      });
      if (error) throw error;
    }
  };

  const signUp = async (email: string, phone: string, password: string, name: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: authData.user.id,
          nom: name,
          telephone: phone,
          email,
          statut: 'actif',
        });

      if (clientError) {
        console.error('Error creating client record:', clientError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <ClientAuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}
