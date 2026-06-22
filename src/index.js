import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { WalletProvider } from './WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScalabilityProvider } from './context/ScalabilityContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Prevent irrelevant MetaMask errors from crashing the React app during development
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('Failed to connect to MetaMask')) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <ScalabilityProvider>
          <WalletProvider>
            <App />
          </WalletProvider>
        </ScalabilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Enable PWA / Offline Caching
serviceWorkerRegistration.register();

reportWebVitals();