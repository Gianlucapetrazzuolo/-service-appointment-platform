import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/domain';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Evita race condition tra fetch del profilo concorrenti.
  const fetchSeq = useRef(0);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const seq = ++fetchSeq.current;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    // Ignora se nel frattempo è partita una richiesta più recente.
    if (seq !== fetchSeq.current) return;
    if (error) {
      console.error('Errore nel caricamento del profilo:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    let active = true;

    // Sessione iniziale
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (active) setLoading(false);
    });

    // Aggiornamenti successivi (login/logout/refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      void loadProfile(newSession?.user.id);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async ({ email, password, fullName, phone }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: phone ?? null } },
      });
      if (error) throw error;
      // Se la conferma email è attiva, non c'è ancora una sessione.
      return { needsEmailConfirm: !data.session };
    },
    [],
  );

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id);
  }, [loadProfile, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === 'admin',
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [loading, session, profile, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
