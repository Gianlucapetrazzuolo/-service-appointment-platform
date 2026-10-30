import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/domain';

export interface AuthContextValue {
  /** True finché la sessione iniziale non è stata risolta. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) => Promise<{ needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
  /** Ricarica il profilo dal DB (es. dopo un cambio ruolo). */
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>.');
  return ctx;
}
