'use client';

import { createContext, useContext } from 'react';

interface UserContextValue {
  id?: string;
  email?: string;
  name?: string;
}

const UserContext = createContext<UserContextValue>({});

export function UserProvider({
  user,
  children,
}: {
  user?: UserContextValue;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={user ?? {}}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
