import React, { createContext, useContext } from 'react';

const EnvConfigContext = createContext(null);

export const EnvConfigProvider = ({ children, config }) => {
  return (
    <EnvConfigContext.Provider value={config}>
      {children}
    </EnvConfigContext.Provider>
  );
};

export const useEnvConfig = () => useContext(EnvConfigContext);