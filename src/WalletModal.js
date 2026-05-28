import { useState } from "react";
import "./WalletModal.css";

const WALLETS = [
  {
    id: "freighter",
    name: "Freighter",
    subtitle: "Stellar Extension",
    letter: "F",
    color: "#7C3AED",
    detect: () => typeof window.freighter !== "undefined",
    installUrl: {
      desktop: "https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk",
      android: "https://play.google.com/store/apps/details?id=app.freighter",
      ios: "https://apps.apple.com/app/freighter/id1556917909",
    },
    connect: async () => {
      const result = await window.freighter.requestAccess();
      return result.address || result.publicKey;
    },
  },
  {
    id: "albedo",
    name: "Albedo",
    subtitle: "Web Wallet",
    letter: "A",
    color: "#2563EB",
    detect: () => true, // Albedo is web-based — always available
    installUrl: {
      desktop: "https://albedo.link",
      android: "https://albedo.link",
      ios: "https://albedo.link",
    },
    connect: async () => {
      // Note: In a real app, Albedo uses its own SDK. 
      // For this demonstration, we assume it returns an address if available or opens a window.
      // The user's provided code for Albedo just opens a window.
      window.open("https://albedo.link", "_blank");
      return null;
    },
  },
  {
    id: "xbull",
    name: "xBull",
    subtitle: "Stellar Wallet",
    letter: "X",
    color: "#7C3AED",
    detect: () => typeof window.xBullSDK !== "undefined",
    installUrl: {
      desktop: "https://chromewebstore.google.com/detail/xbull-wallet/omajpeaffjgmlpmhbfdjepdejoemkkd",
      android: "https://play.google.com/store/apps/details?id=io.xbull.app",
      ios: "https://apps.apple.com/app/xbull-wallet/id1583190078",
    },
    connect: async () => {
      const result = await window.xBullSDK.connect();
      return result.publicKey;
    },
  },
];

const getInstallUrl = (wallet) => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return wallet.installUrl.android;
  if (/iphone|ipad/i.test(ua)) return wallet.installUrl.ios;
  return wallet.installUrl.desktop;
};

const isMobileDevice = () => /android|iphone|ipad/i.test(navigator.userAgent);

export default function WalletModal({ onClose, onConnect }) {
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [installing, setInstalling] = useState(null);

  const handleWalletClick = async (wallet) => {
    setError("");
    setSelected(wallet.id);

    const isInstalled = wallet.detect();

    // Not installed — redirect to install page
    if (!isInstalled) {
      setInstalling(wallet.id);
      const url = getInstallUrl(wallet);
      setTimeout(() => {
        window.open(url, "_blank");
        setInstalling(null);
        setSelected(null);
      }, 800);
      return;
    }

    // Installed — connect karo
    try {
      setLoading(true);
      const address = await wallet.connect();
      if (address) {
        onConnect && onConnect({ wallet: wallet.id, address });
        onClose && onClose();
      }
    } catch (err) {
      setError(`${wallet.name} connect failed. Please try again.`);
      setSelected(null);
    } finally {
      setLoading(false);
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

        <p className="wm-subtitle">Select Wallet</p>

        {/* Wallet List */}
        <div className="wm-list">
          {WALLETS.map((wallet) => {
            const isInstalled  = wallet.detect();
            const isSelected   = selected === wallet.id;
            const isInstalling = installing === wallet.id;
            const isMobile     = isMobileDevice();

            return (
              <button
                key={wallet.id}
                className={`wm-item ${isSelected ? "wm-item--selected" : ""}`}
                onClick={() => handleWalletClick(wallet)}
                disabled={loading}
              >
                {/* Icon */}
                <div
                  className="wm-icon"
                  style={{ background: wallet.color }}
                >
                  {wallet.letter}
                </div>

                {/* Info */}
                <div className="wm-info">
                  <div className="wm-name">{wallet.name}</div>
                  <div className="wm-desc">
                    {isInstalling
                      ? "Opening install page..."
                      : !isInstalled && !isMobile
                      ? "Click to install extension"
                      : !isInstalled && isMobile
                      ? "Click to install app"
                      : wallet.subtitle}
                  </div>
                </div>

                {/* Right Badge */}
                <div className="wm-right">
                  {isInstalling ? (
                    <div className="wm-spinner" />
                  ) : isSelected && isInstalled ? (
                    <div className="wm-check">✓</div>
                  ) : !isInstalled ? (
                    <span className="wm-install-badge">
                      {isMobile ? "📱 Install" : "⬇ Install"}
                    </span>
                  ) : (
                    <span className="wm-available">●</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && <div className="wm-error">{error}</div>}

        {/* Cancel */}
        <button className="wm-cancel" onClick={onClose}>
          Cancel
        </button>

        <p className="wm-footer">
          Your keys are stored securely in your wallet extension.
        </p>
      </div>
    </div>
  );
}