import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Session {
  user: string;
}

interface SessionProviderProps {
  children: ReactNode;
}

const SessionContext = createContext<{
  session: Session | null;
  signIn: () => void;
  signOut: () => void;
}>({
  session: null,
  signIn: () => {},
  signOut: () => {},
});

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);

  const signIn = () => setSession({ user: 'goatMaster' });
  const signOut = () => setSession(null);

  return (
    <SessionContext.Provider value={{ session, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);

