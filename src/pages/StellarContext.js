import React, { createContext, useContext } from 'react';
import { SorobanRpc } from "@stellar/stellar-sdk";

const StellarContext = createContext(null);

export const StellarProvider = ({ children, sdk }) => {
  return (
    <StellarContext.Provider value={{sdk}}>
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => useContext(StellarContext);