"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  displayName: string | null;
  setDisplayName: (name: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ displayName, setDisplayName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserDisplayName() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUserDisplayName must be used within UserProvider");
  }
  return ctx;
}