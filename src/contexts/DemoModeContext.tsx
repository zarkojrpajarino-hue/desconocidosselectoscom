import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type for demo data - flexible structure for tour demonstrations
interface DemoData {
  [key: string]: unknown;
}

interface DemoModeContextType {
  isDemoMode: boolean;
  setDemoMode: (value: boolean) => void;
  demoData: DemoData;
  setDemoData: (data: DemoData) => void;
  clearDemoData: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<DemoData>({});

  const setDemoMode = (value: boolean) => {
    setIsDemoMode(value);
    if (!value) {
      setDemoData({});
    }
  };

  const clearDemoData = () => {
    setDemoData({});
    setIsDemoMode(false);
  };

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        demoData,
        setDemoData,
        clearDemoData,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
