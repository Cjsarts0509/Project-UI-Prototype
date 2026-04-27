import React, { createContext, useContext, useState } from 'react';
import { MOCK_DEDUCTION_MASTERS, DeductionMaster } from '../data/mockStorePartDeduction';

interface DeductionContextType {
  masters: DeductionMaster[];
  setMasters: React.Dispatch<React.SetStateAction<DeductionMaster[]>>;
}

const DeductionContext = createContext<DeductionContextType | undefined>(undefined);

export const DeductionProvider = ({ children }: { children: React.ReactNode }) => {
  const [masters, setMasters] = useState<DeductionMaster[]>(MOCK_DEDUCTION_MASTERS);
  return (
    <DeductionContext.Provider value={{ masters, setMasters }}>
      {children}
    </DeductionContext.Provider>
  );
};

export const useDeductionStore = () => {
  const ctx = useContext(DeductionContext);
  if (!ctx) throw new Error('useDeductionStore must be used within DeductionProvider');
  return ctx;
};
