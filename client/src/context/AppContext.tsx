import React, { createContext, useContext, useState, useCallback } from 'react';
import supabase from '../supabaseClient';
import { User } from '../components/types';

interface Composite {
  id: number;
  user_id: string;
  composite_url: string;
}

interface AppContextProps {
  composites: Composite[];
  fetchComposites: (user: User) => void;
  loading: boolean;
  videoUrls: string[];
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [composites, setComposites] = useState<Composite[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const fetchComposites = useCallback(async (user: User) => {
    if (!user?.uid) {
      console.error('User ID is missing.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('composites')
        .select('*')
        .eq('user_id', user.uid);

      if (error) {
        console.error('Failed to fetch composites:', error.message);
      } else {
        setComposites(data);
      }
    } catch (error) {
      console.error('Failed to fetch composites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      composites, 
      fetchComposites,
      loading, 
      videoUrls, 
      setVideoUrls 
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
