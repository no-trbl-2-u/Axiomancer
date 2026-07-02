import React, { createContext, useContext, ReactNode } from 'react';

interface FontContextType {
  secondaryLoaded: boolean;
}

const FontContext = createContext<FontContextType>({
  secondaryLoaded: false,
});

interface ProviderProps {
  children: ReactNode;
  secondaryLoaded: boolean;
}

export function FontProvider({ children, secondaryLoaded }: ProviderProps) {
  return (
    <FontContext.Provider value={{ secondaryLoaded }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFontFallbacks() {
  const { secondaryLoaded } = useContext(FontContext);
  return { secondaryLoaded };
}