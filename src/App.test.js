import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { WalletProvider } from './WalletContext';
import { ThemeProvider } from './context/ThemeContext';

// Mock complex imports
jest.mock('@stellar/stellar-sdk', () => ({
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
  Horizon: { Server: jest.fn().mockImplementation(() => ({
    loadAccount: jest.fn().mockResolvedValue({
      balances: [{ asset_type: 'native', balance: '100' }]
    })
  })) },
  rpc: { Server: jest.fn().mockImplementation(() => ({})) }
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

jest.mock('lucide-react', () => {
  const OriginalModule = jest.requireActual('lucide-react');
  const mockIcons = {};
  Object.keys(OriginalModule).forEach(key => {
    mockIcons[key] = (props) => <span data-testid={`icon-${key}`} {...props}>{key}</span>;
  });
  return mockIcons;
});

jest.mock('./components/Background', () => () => <div data-testid="background-mock" />);
jest.mock('./firebase', () => ({
  auth: { onAuthStateChanged: jest.fn() },
  db: {},
  rtdb: {},
  storage: {}
}));
jest.mock('./utils/dataIndexer', () => ({
  runFullIndex: jest.fn().mockResolvedValue({}),
  isIndexStale: jest.fn().mockResolvedValue(false),
  readIndexedJobs: jest.fn().mockResolvedValue({ jobs: [], total: 0 }),
}));
jest.mock('./utils/performanceMonitor', () => ({
  perfMonitor: {
    trackApiCall: jest.fn(),
    trackError: jest.fn(),
    startRenderTimer: jest.fn(),
    endRenderTimer: jest.fn(),
    getSummary: jest.fn().mockReturnValue({}),
  },
}));

test('renders FreelanceChain brand name', () => {
  render(
    <BrowserRouter>
      <ThemeProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
  const brandElements = screen.getAllByText(/FreelanceChain/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
