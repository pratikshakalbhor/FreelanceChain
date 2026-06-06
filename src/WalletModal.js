import { useState, useEffect } from "react";
import "./WalletModal.css";

const WALLETS = [
  {
    id: "freighter",
    name: "Freighter",
    subtitle: "Stellar Extension",
    letter: "F",
    color: "#7C3AED",
    detect: (status) => status.freighter,
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
    detect: (status) => status.xbull,
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
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [installing, setInstalling] = useState(null);
  const [detecting, setDetecting] = useState(true);
  const [walletStatus, setWalletStatus] = useState({
    freighter: false,
    xbull: false,
  });

  const checkWallets = () => {
    return {
      freighter: !!(window.freighter || window.freighter?.isFreighter),
      xbull: !!(window.xBullSDK || window.xBullSDK?.isConnected),
    };
  };

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 6; // 3 seconds total (6 * 500ms)

    const interval = setInterval(() => {
      const status = checkWallets();
      setWalletStatus(status);
      attempts++;

      // If both wallets detected or max attempts reached
      if ((status.freighter && status.xbull) || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 500);

    // Initial check
    setWalletStatus(checkWallets());

    // Show detecting state for at least 1.5 seconds for smoother UX
    const timer = setTimeout(() => {
      setDetecting(false);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const handleWalletClick = async (wallet) => {
    setError("");
    setSelected(wallet.id);

    const isInstalled = wallet.detect(walletStatus);

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
        <div className="wm-header">
          <h2 className="wm-title">Connect Wallet</h2>
          <button className="wm-close" onClick={onClose}>✕</button>
        </div>

        {detecting ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="wm-spinner" style={{ margin: "0 auto 16px", width: "40px", height: "40px" }} />
            <p className="wm-subtitle">Detecting wallets...</p>
          </div>
        ) : (
          <>
            <p className="wm-subtitle">Select Wallet</p>

            <div className="wm-list">
              {WALLETS.map((wallet) => {
                const isInstalled = wallet.detect(walletStatus);
                const isSelected = selected === wallet.id;
                const isInstalling = installing === wallet.id;
                const isMobile = isMobileDevice();

                return (
                  <button
                    key={wallet.id}
                    className={`wm-item ${isSelected ? "wm-item--selected" : ""}`}
                    onClick={() => handleWalletClick(wallet)}
                    disabled={loading}
                  >
                    <div className="wm-icon" style={{ background: wallet.color }}>
                      {wallet.letter}
                    </div>

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
          </>
        )}

        {error && <div className="wm-error">{error}</div>}

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