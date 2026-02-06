'use client';

/**
 * Layout Context
 *
 * Allows nested layouts (e.g. Admin) to signal the AppShell
 * to switch to full-width mode (no max-w, no padding).
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface LayoutContextValue {
  fullWidth: boolean;
  setFullWidth: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  fullWidth: false,
  setFullWidth: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [fullWidth, setFullWidth] = useState(false);
  return (
    <LayoutContext.Provider value={{ fullWidth, setFullWidth }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}

/**
 * Drop this component inside a layout to flip the shell to full-width mode.
 * It auto-reverts on unmount (when navigating away from that layout).
 */
export function FullWidthMode() {
  const { setFullWidth } = useLayout();

  useEffect(() => {
    setFullWidth(true);
    return () => setFullWidth(false);
  }, [setFullWidth]);

  return null;
}
