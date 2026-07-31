import React, { createContext, useContext, useState, useEffect } from 'react';

interface UsernameContextType {
  username: string | null;
  setUsername: (username: string) => void;
  clearUsername: () => void;
}

const UsernameContext = createContext<UsernameContextType | undefined>(undefined);

export function UsernameProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load username from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('hawaii-activity-username');
    if (stored) {
      setUsernameState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setUsername = (newUsername: string) => {
    setUsernameState(newUsername);
    localStorage.setItem('hawaii-activity-username', newUsername);
  };

  const clearUsername = () => {
    setUsernameState(null);
    localStorage.removeItem('hawaii-activity-username');
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <UsernameContext.Provider value={{ username, setUsername, clearUsername }}>
      {children}
    </UsernameContext.Provider>
  );
}

export function useUsername() {
  const context = useContext(UsernameContext);
  if (!context) {
    throw new Error('useUsername must be used within UsernameProvider');
  }
  return context;
}
