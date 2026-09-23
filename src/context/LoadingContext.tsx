import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingMessage?: string;
  setLoadingMessage: (message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();

  const value: LoadingContextType = {
    isLoading,
    setLoading: useCallback((loading: boolean) => {
      setIsLoading(loading);
      if (!loading) setLoadingMessage(undefined);
    }, []),
    loadingMessage,
    setLoadingMessage: useCallback((message?: string) => {
      setLoadingMessage(message);
      if (message) setIsLoading(true);
    }, []),
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * Hook to access global loading state.
 * Use for showing full-screen loading indicators during critical operations.
 */
export const useGlobalLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within LoadingProvider');
  }
  return context;
};
