import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Menu } from "lucide-react";
import "./App.css";
import * as StellarSdk from "@stellar/stellar-sdk";
import Sidebar from "./components/Sidebar";
import { HORIZON_URL } from "./constants";
import Background from "./components/Background";
import logo from "./assets/logo.png";
import ErrorBoundary from "./components/ErrorBoundary";
import { useWallet } from "./WalletContext";
import WalletModal from "./WalletModal";
import { runFullIndex, isIndexStale } from "./utils/dataIndexer";
import { errorHandler } from "./utils/errorHandler";
import NotificationPanel from "./components/NotificationPanel";
import { useTheme } from "./context/ThemeContext";

// ── Lazy-loaded pages (code splitting for scalability) ────────────────────
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const PostJobPage = lazy(() => import("./pages/PostJobPage"));
const FindJobsPage = lazy(() => import("./pages/FindJobsPage"));
const MyJobsPage = lazy(() => import("./pages/MyJobsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const EscrowPage = lazy(() => import("./pages/EscrowPage"));
const ResolutionCenter = lazy(() => import("./pages/ResolutionCenter"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));

// ── Loading Fallback ──────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    gap: "16px",
  }}>
    <div style={{
      width: "40px",
      height: "40px",
      border: "3px solid rgba(99,102,241,0.15)",
      borderTopColor: "#7c3aed",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <span style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: "0.85rem",
      color: "rgba(255,255,255,0.4)",
    }}>Loading...</span>
  </div>
);

// ── Protected Route Wrapper with ErrorBoundary + Suspense ─────────────────
const ProtectedRoute = ({ walletAddress, children, pageName }) => {
  if (!walletAddress) return <Navigate to="/login" replace />;
  return (
    <ErrorBoundary title={`Error in ${pageName || 'this page'}`}>
      <Suspense fallback={<PageLoader />}>
        <div className="pages-container">{children}</div>
      </Suspense>
    </ErrorBoundary>
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    walletAddress, 
    isModalOpen, 
    setModalOpen, 
    disconnectWallet, 
    setWalletAddress, 
    setWalletType, 
    setConnectedWallets 
  } = useWallet();
  const { isDark } = useTheme();
  const [balance, setBalance] = useState("0");

  const [accountDetails, setAccountDetails] = useState(null);
  const [jobsPosted, setJobsPosted] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const server = useMemo(
    () => new StellarSdk.Horizon.Server(HORIZON_URL),
    []
  );

  function showError(message, field) {
    alert(message);
  }

  useEffect(() => {
    if (walletAddress) {
      // Auto-index if stale
      isIndexStale().then(stale => {
        if (stale) runFullIndex(walletAddress);
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    const fetchData = async () => {
      if (walletAddress) {
        try {
          const account = await server.loadAccount(walletAddress);

          setAccountDetails(account);
          const xlmBalance = account.balances.find(
            (b) => b.asset_type === "native"
          );
          setBalance(parseFloat(xlmBalance.balance).toFixed(2));

        } catch (e) {
          setAccountDetails(null);
          const errorMessage = errorHandler(e);

          showError(
            `Error loading account (${walletAddress}): ${errorMessage}.`,
            "accountError"
          );

          console.error("Account error:", e);
          setBalance("N/A");
        }
      }
    };
    fetchData();
  }, [walletAddress, server]);

  return (
    <>
      <Background />
      <style>{`
        .main-content {
          flex: 1;
          width: 100%;
          min-height: 100vh;
          transition: margin-left 0.3s ease;
        }
        @media (min-width: 768px) {
          .main-content.with-sidebar {
            margin-left: 240px;
            width: calc(100% - 240px);
          }
        }
      `}</style>
      <div style={{ position: "relative", zIndex: 2, display: "flex", width: "100%", minHeight: "100vh" }}>
        <div
          className={`app-container ${walletAddress ? "loggedin" : "loggedout"}`}
          style={{
            display: "flex",
            width: "100%",
            color: isDark ? "#fff" : "#1a1a2e",
            minHeight: "100vh"
          }}
        >
          {/* Wallet Connection Modal */}
          {isModalOpen && (
            <WalletModal
              onClose={() => setModalOpen(false)}
              onConnect={({ wallet, address }) => {
                setWalletAddress(address);
                setWalletType(wallet.toUpperCase());
                setConnectedWallets(prev => {
                  if (prev.some(w => w.address === address)) return prev;
                  return [...prev, { 
                    address, 
                    type: wallet.toUpperCase(), 
                    name: wallet.charAt(0).toUpperCase() + wallet.slice(1) 
                  }];
                });
                setModalOpen(false);
              }}
            />
          )}

          {walletAddress && (
            <Sidebar
              walletAddress={walletAddress}
              onDisconnect={() => disconnectWallet()}
              isOpen={mobileMenuOpen}
              setIsOpen={setMobileMenuOpen}
            />
          )}

          {/* Top Navigation Bar */}
          {walletAddress && (
            <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: "60px",
              background: isDark ? "rgba(13,17,28,0.95)" : "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              gap: "8px",
              zIndex: 45,
            }}>

              {/* Left — Logo */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <img src={logo} alt="FreelanceChain Logo" style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover" }} />
                <span style={{
                  color: isDark ? "#fff" : "#1a1a2e",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: "1rem",
                }}>FreelanceChain</span>
              </div>

              {/* Right — Icons + Wallet + Hamburger */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                {/* Chat Icon */}
                <div
                  onClick={() => navigate('/chat')}
                  style={{
                    width: "34px", height: "34px",
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Chat"
                >
                  <MessageCircle size={16} color="#a78bfa" />
                </div>

                {/* Notification */}
                <NotificationPanel walletAddress={walletAddress} />

                {/* Wallet Address */}
                <div className="wallet-info-badge" style={{
                  padding: "4px 10px",
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "10px",
                  fontSize: "0.72rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isDark ? "#a78bfa" : "#6d28d9",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-3)}
                </div>

                {/* Hamburger (Mobile Only) */}
                <div
                  className="mobile-menu-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{
                    width: "34px", height: "34px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}>
                  <Menu size={24} color={isDark ? "#fff" : "#1a1a2e"} />
                </div>
              </div>
            </div>
          )}

          <main className={`main-content ${walletAddress ? 'with-sidebar' : ''}`}
            style={{ paddingTop: walletAddress ? "70px" : "0" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ width: "100%", minHeight: "100%" }}
              >
            <Routes>
              {/*  Mobile Responsive Login Page */}
              <Route path="/login" element={
                !walletAddress ? (
                  <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                  }}>
                    <div style={{
                      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "24px",
                      padding: "clamp(24px, 6vw, 48px)",
                      width: "100%",
                      maxWidth: "480px",
                      textAlign: "center",
                      boxShadow: isDark ? "0 25px 50px rgba(88,28,135,0.4)" : "0 4px 24px rgba(0,0,0,0.1)",
                    }}>
                      <img src={logo} alt="FreelanceChain Logo" style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "20px",
                        marginBottom: "24px",
                        display: "block",
                        margin: "0 auto 24px",
                        boxShadow: "0 10px 40px rgba(99,102,241,0.3)"
                      }} />

                      <h1 style={{
                        fontSize: "clamp(1.4rem, 5vw, 2rem)",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 800,
                        color: isDark ? "#fff" : "#1a1a2e",
                        marginBottom: "10px",
                        lineHeight: 1.2,
                      }}>FreelanceChain - DApp</h1>

                      <p style={{
                        fontSize: "clamp(0.85rem, 3vw, 1rem)",
                        fontFamily: "'Inter', sans-serif",
                        color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                        marginBottom: "8px",
                      }}>Decentralized Freelancer Platform</p>

                      <p style={{
                        fontSize: "0.8rem",
                        color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                        marginBottom: "32px",
                      }}>Connect your wallet to get started</p>



                      <button
                        style={{
                          width: "100%",
                          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                          color: "#fff",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                          padding: "clamp(12px, 3vw, 16px)",
                          borderRadius: "14px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "clamp(0.9rem, 3vw, 1rem)",
                          boxShadow: "0 8px 24px rgba(124,58,237,0.4)",
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => setModalOpen(true)}
                        onMouseEnter={e => e.target.style.transform = "scale(1.02)"}
                        onMouseLeave={e => e.target.style.transform = "scale(1)"}
                      >
                        Connect Wallet
                      </button>

                      <p style={{
                        marginTop: "20px",
                        fontSize: "0.75rem",
                        color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                      }}>
                        Supports Freighter • Albedo • xBull
                      </p>
                    </div>
                  </div>
                ) : <Navigate to="/" replace />
              } />

              <Route
                path="/"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Dashboard">
                    <DashboardPage
                      walletAddress={walletAddress}
                      balance={balance}
                      jobs={[]}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Payment">
                    <PaymentPage
                      walletAddress={walletAddress}
                      balance={balance}
                      setBalance={setBalance}
                      server={server}
                    />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Profile">
                    <ProfilePage account={accountDetails} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/activity"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Activity">
                    <ActivityPage walletAddress={walletAddress} />
                  </ProtectedRoute>
                }
              />
              <Route path="/monitoring" element={
                <ProtectedRoute walletAddress={walletAddress} pageName="Monitoring">
                  <MonitoringPage walletAddress={walletAddress} />
                </ProtectedRoute>
              } />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Chat">
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post-job"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Post Job">
                    <PostJobPage
                      walletAddress={walletAddress}
                      onJobPosted={() => setJobsPosted(jobsPosted + 1)}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/find-jobs"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Find Jobs">
                    <FindJobsPage walletAddress={walletAddress} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-jobs"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="My Jobs">
                    <MyJobsPage walletAddress={walletAddress} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/escrow"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Escrow">
                    <EscrowPage 
                      walletAddress={walletAddress} 
                      onJobPosted={() => setJobsPosted(jobsPosted + 1)}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/resolution-center"
                element={
                  <ProtectedRoute walletAddress={walletAddress} pageName="Resolution Center">
                    <ResolutionCenter walletAddress={walletAddress} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ErrorBoundary title="Error in Categories">
                    <Suspense fallback={<PageLoader />}>
                      <div className="pages-container">
                        <CategoriesPage />
                      </div>
                    </Suspense>
                  </ErrorBoundary>
                }
              />
            </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
