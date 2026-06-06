import { useState, useEffect } from "react";
import { checkConnection, connectFreighter, connectAlbedo, connectXBull } from "./walletService";
import "./WalletModal.css";

const isMobileDevice = () => /android|iphone|ipad/i.test(navigator.userAgent);

const INSTALL_URLS = {
  freighter: {
    desktop: "https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk",
    android: "https://play.google.com/store/apps/details?id=app.freighter",
    ios: "https://apps.apple.com/app/freighter/id1556917909",
  },
  xbull: {
    desktop: "https://chromewebstore.google.com/detail/xbull-wallet/omajpeaffjgmlpmhbfdjepdejoemkkd",
    android: "https://play.google.com/store/apps/details?id=io.xbull.app",
    ios: "https://apps.apple.com/app/xbull-wallet/id1583190078",
  },
  albedo: {
    desktop: "https://albedo.link",
    android: "https://albedo.link",
    ios: "https://albedo.link",
  },
};

const getInstallUrl = (walletId) => {
  const urls = INSTALL_URLS[walletId] || {};
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return urls.android;
  if (/iphone|ipad/i.test(ua)) return urls.ios;
  return urls.desktop;
};

const WALLETS = [
  { id: "freighter", name: "Freighter", subtitle: "Stellar Extension", letter: "F", color: "#7C3AED" },
  { id: "albedo",    name: "Albedo",    subtitle: "Web Wallet — Always Available", letter: "A", color: "#2563EB" },
  { id: "xbull",    name: "xBull",     subtitle: "Stellar Wallet", letter: "X", color: "#0891B2" },
];

export default function WalletModal({ onClose, onConnect }) {
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [installing, setInstalling] = useState(null);
  const [detecting, setDetecting] = useState(true);
  const [walletStatus, setWalletStatus] = useState({ freighter: false, xbull: false });

  // ── Detect wallets using @stellar/freighter-api ────────────────────────────
  useEffect(() => {
    const detect = async () => {
      setDetecting(true);
      try {
        // Use the official walletService which calls isConnected() from @stellar/freighter-api
        const status = await checkConnection();
        console.log("[WalletModal] Detection result:", status);
        setWalletStatus(status);
      } catch (e) {
        console.warn("[WalletModal] Detection error:", e);
        setWalletStatus({ freighter: false, xbull: false });
      } finally {
        setDetecting(false);
      }
    };

    // Give the extension a small head-start to inject itself
    const timer = setTimeout(detect, 300);
    return () => clearTimeout(timer);
  }, []);

  const isInstalled = (walletId) => {
    if (walletId === "albedo") return true; // Always available (web-based)
    return walletStatus[walletId] === true;
  };

  const handleWalletClick = async (wallet) => {
    setError("");
    setSelected(wallet.id);

    if (!isInstalled(wallet.id)) {
      // Redirect to install page
      setInstalling(wallet.id);
      setTimeout(() => {
        window.open(getInstallUrl(wallet.id), "_blank");
        setInstalling(null);
        setSelected(null);
      }, 800);
      return;
    }

    // Connect!
    try {
      setConnecting(true);
      let result;

      if (wallet.id === "freighter") {
        result = await connectFreighter();
      } else if (wallet.id === "albedo") {
        result = await connectAlbedo();
      } else if (wallet.id === "xbull") {
        result = await connectXBull();
      }

      if (result?.address) {
        console.log("[WalletModal] Connected:", result);
        onConnect && onConnect({ wallet: result.type || wallet.id, address: result.address });
        onClose && onClose();
      }
    } catch (err) {
      console.error("[WalletModal] Connect error:", err);
      setError(
        err.message?.includes("User declined")
          ? "Connection declined. Please approve in your wallet."
          : `${wallet.name} connection failed: ${err.message || "Unknown error"}`
      );
      setSelected(null);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="wm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wm-modal">

        {/* Header */}
        <div className="wm-header">
          <h2 className="wm-title">Connect Wallet</h2>
          <button className="wm-close" onClick={onClose}>✕</button>
        </div>

        {detecting ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="wm-spinner" style={{ margin: "0 auto 16px", width: "32px", height: "32px" }} />
            <p className="wm-subtitle" style={{ margin: 0 }}>Detecting wallets...</p>
          </div>
        ) : (
          <>
            <p className="wm-subtitle">Select Wallet</p>

            <div className="wm-list">
              {WALLETS.map((wallet) => {
                const installed  = isInstalled(wallet.id);
                const isSelected = selected === wallet.id;
                const isLoading  = installing === wallet.id || (connecting && isSelected);
                const isMobile   = isMobileDevice();

                return (
                  <button
                    key={wallet.id}
                    className={`wm-item ${isSelected ? "wm-item--selected" : ""}`}
                    onClick={() => handleWalletClick(wallet)}
                    disabled={connecting}
                  >
                    {/* Icon */}
                    <div className="wm-icon" style={{ background: wallet.color }}>
                      {wallet.letter}
                    </div>

                    {/* Info */}
                    <div className="wm-info">
                      <div className="wm-name">{wallet.name}</div>
                      <div className="wm-desc">
                        {isLoading
                          ? installing === wallet.id ? "Opening install page..." : "Connecting..."
                          : !installed && !isMobile
                          ? "Click to install extension"
                          : !installed && isMobile
                          ? "Click to install app"
                          : wallet.subtitle}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="wm-right">
                      {isLoading ? (
                        <div className="wm-spinner" />
                      ) : isSelected && installed ? (
                        <div className="wm-check">✓</div>
                      ) : !installed ? (
                        <span className="wm-install-badge">
                          {isMobile ? "📱 Install" : "⬇ Install"}
                        </span>
                      ) : (
                        <span className="wm-available" style={{ color: "#10b981", fontSize: "1.2rem" }}>●</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Error */}
        {error && <div className="wm-error">{error}</div>}

        {/* Cancel */}
        <button className="wm-cancel" onClick={onClose}>Cancel</button>

        <p className="wm-footer">
          Your keys are stored securely in your wallet extension.
        </p>
      </div>
    </div>
  );
}