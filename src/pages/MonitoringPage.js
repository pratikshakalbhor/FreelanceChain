import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import { containerVariants, itemVariants } from "../components/ProfilePage";
import * as StellarSdk from "@stellar/stellar-sdk";
import { HORIZON_URL, ESCROW_CONTRACT_ID, CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_SERVER } from "../constants";
import IndexerStatus from "../components/IndexerStatus";

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function MonitoringPage({ walletAddress }) {
  const { isDark } = useTheme();

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Stellar metrics
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentTxs, setRecentTxs] = useState([]);
  const [xlmBalance, setXlmBalance] = useState("0");

  // Firebase metrics
  const [totalListings, setTotalListings] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [soldNFTs, setSoldNFTs] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [uniqueUsers, setUniqueUsers] = useState(new Set());

  // System health
  const [horizonStatus, setHorizonStatus] = useState("checking");
  const [sorobanStatus, setSorobanStatus] = useState("checking");
  const [firebaseStatus, setFirebaseStatus] = useState("checking");

  // ── Fetch Stellar data ────────────────────────────────────────────────────
  const fetchStellarData = async () => {
    if (!walletAddress) return;
    try {
      // Horizon health check
      const horizonRes = await fetch(`${HORIZON_URL}/`).catch(() => null);
      setHorizonStatus(horizonRes?.ok ? "healthy" : "degraded");

      // Account balance
      const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);
      const account = await horizonServer.loadAccount(walletAddress).catch(() => null);
      if (account) {
        const xlm = account.balances.find(b => b.asset_type === "native");
        if (xlm) setXlmBalance(parseFloat(xlm.balance).toFixed(2));
      }

      // Recent transactions
      const txRes = await horizonServer.transactions()
        .forAccount(walletAddress)
        .order("desc")
        .limit(5)
        .call().catch(() => null);
      if (txRes) setRecentTxs(txRes.records || []);

      // NFT contract total
      try {
        const dummy = new StellarSdk.Account(walletAddress, "0");
        const nftTx = new StellarSdk.TransactionBuilder(dummy, {
          fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(StellarSdk.Operation.invokeContractFunction({
            contract: CONTRACT_ID,
            function: "get_total",
            args: [],
          }))
          .setTimeout(30).build();
        const nftSim = await SOROBAN_SERVER.simulateTransaction(nftTx);
        if (nftSim?.result?.retval) {
          setTotalNFTs(Number(StellarSdk.scValToNative(nftSim.result.retval)));
        }
        setSorobanStatus("healthy");
      } catch { setSorobanStatus("degraded"); }

      // Escrow jobs total
      try {
        const dummy = new StellarSdk.Account(walletAddress, "0");
        const jobTx = new StellarSdk.TransactionBuilder(dummy, {
          fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
        })
          .addOperation(StellarSdk.Operation.invokeContractFunction({
            contract: ESCROW_CONTRACT_ID,
            function: "get_total",
            args: [],
          }))
          .setTimeout(30).build();
        const jobSim = await SOROBAN_SERVER.simulateTransaction(jobTx);
        if (jobSim?.result?.retval) {
          setTotalJobs(Number(StellarSdk.scValToNative(jobSim.result.retval)));
        }
      } catch { }

    } catch (e) {
      console.error("Stellar fetch error:", e);
      setHorizonStatus("degraded");
    }
  };

  // ── Firebase listeners ────────────────────────────────────────────────────
  useEffect(() => {
    // Marketplace data
    const marketRef = ref(db, "marketplace");
    const unsubMarket = onValue(marketRef, (snap) => {
      const data = snap.val() || {};
      const items = Object.values(data);
      setTotalListings(items.length);
      setActiveListings(items.filter(i => i.listed && !i.sold).length);
      setSoldNFTs(items.filter(i => i.sold).length);

      // Track unique users
      const users = new Set();
      items.forEach(i => {
        if (i.ownerFull) users.add(i.ownerFull);
      });
      setUniqueUsers(users);
      setFirebaseStatus("healthy");
    }, () => setFirebaseStatus("degraded"));

    // Chats
    const chatRef = ref(db, "chats");
    const unsubChat = onValue(chatRef, (snap) => {
      const data = snap.val() || {};
      setTotalChats(Object.keys(data).length);
    });

    // Notifications
    const notifRef = ref(db, "notifications");
    const unsubNotif = onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      let count = 0;
      Object.values(data).forEach(userNotifs => {
        count += Object.keys(userNotifs).length;
      });
      setTotalNotifications(count);
    });

    return () => { unsubMarket(); unsubChat(); unsubNotif(); };
  }, []);

  // ── Initial load + auto refresh ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStellarData();
      setLoading(false);
      setLastRefresh(new Date());
    };
    load();
    const interval = setInterval(async () => {
      await fetchStellarData();
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [walletAddress]); // eslint-disable-line

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const StatusDot = ({ status }) => (
    <span style={{
      display: "inline-block",
      width: "8px", height: "8px", borderRadius: "50%",
      background: status === "healthy" ? "#10b981" : status === "degraded" ? "#f59e0b" : "#64748b",
      marginRight: "6px",
      boxShadow: status === "healthy" ? "0 0 6px #10b981" : "none",
    }} />
  );

  const MetricCard = ({ label, value, sub, color = "#6366f1", icon }) => (
    <motion.div variants={itemVariants} style={{
      background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
      borderRadius: "16px", padding: "20px",
      display: "flex", flexDirection: "column", gap: "8px",
    }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color }}>
        {loading ? "..." : value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>{sub}</div>}
    </motion.div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
      <motion.div style={{ maxWidth: "1100px", margin: "0 auto" }} variants={containerVariants} initial="hidden" animate="visible">

        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, color: isDark ? "#fff" : "#0f172a", margin: 0 }}>
              System Monitoring
            </h1>
            <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginTop: "4px", fontSize: "0.9rem" }}>
              FreelanceChain — Live metrics dashboard
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
            <div style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              Last updated: {formatTime(lastRefresh)}
            </div>
            <div style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              Auto-refresh every 30s
            </div>
            <button onClick={async () => { setLoading(true); await fetchStellarData(); setLoading(false); setLastRefresh(new Date()); }}
              style={{ padding: "6px 14px", background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: "#6366f1", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
              Refresh Now
            </button>
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div variants={itemVariants} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#fff" : "#0f172a", margin: "0 0 16px" }}>System Health</h2>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[
              { name: "Stellar Horizon", status: horizonStatus, url: HORIZON_URL },
              { name: "Soroban RPC", status: sorobanStatus, url: "soroban-testnet.stellar.org" },
              { name: "Firebase DB", status: firebaseStatus, url: "firebaseapp.com" },
            ].map(service => (
              <div key={service.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <StatusDot status={service.status} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isDark ? "#fff" : "#0f172a" }}>{service.name}</div>
                  <div style={{ fontSize: "0.72rem", color: service.status === "healthy" ? "#10b981" : service.status === "degraded" ? "#f59e0b" : "#64748b", textTransform: "capitalize" }}>
                    {service.status === "checking" ? "Checking..." : service.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Indexer Status */}
        <IndexerStatus walletAddress={walletAddress} />

        {/* Blockchain Metrics */}
        <motion.div variants={itemVariants} style={{ marginBottom: "8px" }}>
          <h2 style={{ fontWeight: 700, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.8rem" }}>Blockchain Metrics</h2>
        </motion.div>
        <motion.div variants={containerVariants} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <MetricCard label="Total NFTs Minted" value={totalNFTs} sub="On-chain (Soroban)" color="#8b5cf6" />
          <MetricCard label="Total Jobs" value={totalJobs} sub="Escrow contract" color="#6366f1" />
          <MetricCard label="XLM Balance" value={`${xlmBalance} XLM`} sub="Connected wallet" color="#10b981" />
          <MetricCard label="Recent Transactions" value={recentTxs.length} sub="Last 5 on Horizon" color="#60a5fa" />
        </motion.div>

        {/* Marketplace Metrics */}
        <motion.div variants={itemVariants} style={{ marginBottom: "8px" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Marketplace & Firebase Metrics</h2>
        </motion.div>
        <motion.div variants={containerVariants} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <MetricCard label="Total Listings" value={totalListings} sub="All NFTs listed" color="#f59e0b" />
          <MetricCard label="Active Listings" value={activeListings} sub="Currently for sale" color="#34d399" />
          <MetricCard label="NFTs Sold" value={soldNFTs} sub="Completed sales" color="#ec4899" />
          <MetricCard label="Unique Users" value={uniqueUsers.size} sub="From marketplace" color="#fb923c" />
          <MetricCard label="Chat Rooms" value={totalChats} sub="Active job chats" color="#a78bfa" />
          <MetricCard label="Notifications" value={totalNotifications} sub="Total sent" color="#38bdf8" />
        </motion.div>

        {/* Recent Transactions */}
        {recentTxs.length > 0 && (
          <motion.div variants={itemVariants} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#fff" : "#0f172a", margin: "0 0 16px" }}>Recent On-chain Transactions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentTxs.map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontFamily: "monospace", color: isDark ? "#a78bfa" : "#6366f1" }}>
                      {tx.hash?.slice(0, 12)}...{tx.hash?.slice(-8)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", marginTop: "2px" }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "6px", background: tx.successful ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: tx.successful ? "#10b981" : "#f87171", fontWeight: 600 }}>
                      {tx.successful ? "Success" : "Failed"}
                    </span>
                    <a href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "0.72rem", color: "#6366f1", textDecoration: "none", fontWeight: 600 }}>
                      Explorer →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contract Info */}
        <motion.div variants={itemVariants} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", padding: "20px" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: isDark ? "#fff" : "#0f172a", margin: "0 0 16px" }}>Contract Registry</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { name: "NFT Contract", id: CONTRACT_ID, explorer: `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}` },
              { name: "Escrow Contract", id: ESCROW_CONTRACT_ID, explorer: `https://stellar.expert/explorer/testnet/contract/${ESCROW_CONTRACT_ID}` },
            ].map(c => (
              <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isDark ? "#fff" : "#0f172a" }}>{c.name}</div>
                  <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", marginTop: "2px" }}>
                    {c.id?.slice(0, 20)}...{c.id?.slice(-8)}
                  </div>
                </div>
                <a href={c.explorer} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.75rem", color: "#6366f1", textDecoration: "none", fontWeight: 600, padding: "4px 10px", background: "rgba(99,102,241,0.1)", borderRadius: "6px", border: "1px solid rgba(99,102,241,0.2)" }}>
                  View on Explorer →
                </a>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} style={{ textAlign: "center", marginTop: "24px", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", fontSize: "0.75rem" }}>
          FreelanceChain Monitoring Dashboard • Stellar Testnet • Auto-refreshes every 30 seconds
        </motion.div>

      </motion.div>
    </div>
  );
}