import { useState, useEffect, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useWallet } from "../WalletContext";
import { signTransaction } from "../walletService";
import {
  NETWORK, NETWORK_PASSPHRASE,
  ESCROW_CONTRACT_ID,
  SUPPORTED_TOKENS, SOROBAN_SERVER,
} from "../constants";
import { storeNotification } from "../utils/notificationService";
import { recordActivity } from "../utils/activityService";
import { readIndexedJobs, indexJobs } from "../utils/dataIndexer";
import { sorobanQueue, PRIORITY } from "../utils/requestQueue";
import { cacheManager } from "../utils/cacheManager";
import { perfMonitor } from "../utils/performanceMonitor";

const JOBS_CACHE_KEY = "escrow/jobs";
const JOBS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const JOBS_PAGE_SIZE = 10; // Paginated loading

const normalizeStatus = (status) => {
  if (Array.isArray(status)) return status[0];
  return status;
};

const getStatusKey = (status) => {
  const s = normalizeStatus(status);
  if (typeof s === "number") return s;
  if (typeof s === "string") return s;
  if (typeof s === "object" && s !== null) return Object.keys(s)[0];
  return 0;
};

const buildSignSubmit = async (txUnsigned, walletType, label, onStatus) => {
  if (!walletType) {
    throw new Error("No wallet connected. Please connect Freeway, Albedo, or xBull first.");
  }

  // Check if it's a Soroban transaction (contains InvokeHostFunction)
  const isSoroban = txUnsigned.operations.some(op => op.type === "invokeHostFunction" || op.type === "invokeContractFunction");

  let assembled = txUnsigned;

  if (isSoroban) {
    onStatus(`⏳ ${label}: simulating transaction...`, "info");

    // Use request queue for simulation (rate-limited + retry)
    let simulation;
    try {
      simulation = await sorobanQueue.enqueue(
        () => SOROBAN_SERVER.simulateTransaction(txUnsigned),
        { key: `sim:${label}:${Date.now()}`, priority: PRIORITY.URGENT }
      );
    } catch (e) {
      throw new Error(`${label} simulation failed: ${e.message}`);
    }
    if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
      throw new Error(`${label} simulation error: ${simulation.error}`);
    }
    try {
      assembled = StellarSdk.rpc.assembleTransaction(txUnsigned, simulation).build();
    } catch (e) {
      throw new Error(`${label} assembly failed: ${e.message}`);
    }
  }

  onStatus(`✍️ ${label}: please sign in your wallet...`, "info");
  const signedXdr = await signTransaction(assembled.toXDR(), {
    walletType,
    network: NETWORK,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (!signedXdr) throw new Error(`${label}: signing cancelled.`);
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  if (isSoroban) {
    // Use request queue for submission
    const response = await sorobanQueue.enqueue(
      () => SOROBAN_SERVER.sendTransaction(signedTx),
      { key: `send:${label}`, priority: PRIORITY.URGENT }
    );
    if (response.status === "ERROR") {
      throw new Error(`${label} error: ${JSON.stringify(response.errorResult ?? response)}`);
    }
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await sorobanQueue.enqueue(
        () => SOROBAN_SERVER.getTransaction(response.hash),
        { key: `poll:${response.hash}:${i}`, priority: PRIORITY.URGENT }
      );
      if (poll.status === "SUCCESS") return { hash: response.hash, retval: poll.returnValue };
      if (poll.status === "FAILED") throw new Error(`${label} failed on-chain.`);
    }
    throw new Error(`${label} timed out. Hash: ${response.hash}`);
  } else {
    // Classic transaction submission via Horizon
    const HORIZON_URL = "https://horizon-testnet.stellar.org";
    const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);
    onStatus(`🚀 ${label}: submitting to network...`, "info");
    const result = await horizon.submitTransaction(signedTx);
    return { hash: result.hash, retval: null };
  }
};

export const useEscrow = () => {
  const { walletAddress, walletType } = useWallet();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");

  // Pagination state
  const [totalJobs, setTotalJobs] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const showStatus = useCallback((msg, type = "info") => {
    setStatus(msg);
    setStatusType(type);
    if (type === "success") setTimeout(() => setStatus(""), 6000);
  }, []);

  /**
   * Fetch a single job by ID via Soroban simulation.
   * Uses request queue for rate limiting and deduplication.
   */
  const fetchJobById = useCallback(async (id, walletAddr) => {
    const dummyAccount = new StellarSdk.Account(walletAddr, "0");
    const jobTx = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.invokeContractFunction({
        contract: ESCROW_CONTRACT_ID, function: "get_job",
        args: [StellarSdk.nativeToScVal(id, { type: "u32" })],
      }))
      .setTimeout(30).build();

    // Queue the simulation with deduplication key
    const jobSim = await sorobanQueue.enqueue(
      () => SOROBAN_SERVER.simulateTransaction(jobTx),
      { key: `get_job:${id}`, priority: PRIORITY.NORMAL }
    );

    if (jobSim?.result?.retval) {
      const job = StellarSdk.scValToNative(jobSim.result.retval);
      return { ...job, id };
    }
    return null;
  }, []);

  /**
   * Load jobs with pagination support.
   * First page loads fast, subsequent pages loaded on demand.
   */
  const loadJobs = useCallback(async (silent = false, page = null) => {
    if (!walletAddress) return;
    const startTime = performance.now();

    // 1. Check cache first (instant)
    if (!silent && page === null) {
      const cachedJobs = cacheManager.get(JOBS_CACHE_KEY);
      if (cachedJobs && cachedJobs.length > 0) {
        setJobs(cachedJobs);
        // Continue to refresh in background
      }
    }

    // Also try Firebase cache
    if (!silent && page === null) {
      try {
        const cached = await readIndexedJobs();
        if (cached && cached.jobs.length > 0) {
          setJobs(cached.jobs);
          setTotalJobs(cached.total);
          cacheManager.set(JOBS_CACHE_KEY, cached.jobs, JOBS_CACHE_TTL);
        }
      } catch (e) {
        console.warn("[useEscrow] Cache read failed:", e);
      }
    }

    if (!silent) setLoading(true);

    try {
      const dummyAccount = new StellarSdk.Account(walletAddress, "0");
      
      // Get Total (with dedup — same key reuses inflight promise)
      const totalTx = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(StellarSdk.Operation.invokeContractFunction({
          contract: ESCROW_CONTRACT_ID, function: "get_total", args: [],
        }))
        .setTimeout(30).build();
      
      const totalSim = await sorobanQueue.enqueue(
        () => SOROBAN_SERVER.simulateTransaction(totalTx),
        { key: "get_total", priority: PRIORITY.NORMAL }
      );

      if (!totalSim?.result?.retval) { 
        if (!silent) setJobs([]); 
        return; 
      }
      
      const total = Number(StellarSdk.scValToNative(totalSim.result.retval));
      setTotalJobs(total);
      if (!total) { 
        if (!silent) setJobs([]); 
        return; 
      }

      // 2. Paginated fetch — load in batches of JOBS_PAGE_SIZE
      const startId = page !== null 
        ? (page * JOBS_PAGE_SIZE) + 1 
        : 1;
      const endId = page !== null 
        ? Math.min(startId + JOBS_PAGE_SIZE - 1, total) 
        : total; // First load gets all (or use total for full refresh)

      const idsToFetch = [];
      for (let i = startId; i <= endId; i++) {
        idsToFetch.push(i);
      }

      // Fetch in parallel with rate limiting via the queue
      const jobPromises = idsToFetch.map(id => 
        fetchJobById(id, walletAddress).catch(e => {
          console.error("Job load error", id, e);
          return null;
        })
      );

      const newJobs = (await Promise.all(jobPromises)).filter(Boolean);

      if (page !== null && page > 0) {
        // Append to existing jobs
        setJobs(prev => {
          const existingIds = new Set(prev.map(j => j.id));
          const unique = newJobs.filter(j => !existingIds.has(j.id));
          return [...prev, ...unique];
        });
      } else {
        setJobs(newJobs);
      }

      setLoadedCount(endId);
      setHasMore(endId < total);

      // 3. Update cache
      cacheManager.set(JOBS_CACHE_KEY, page !== null && page > 0 
        ? [...jobs, ...newJobs] 
        : newJobs, JOBS_CACHE_TTL);

      // 4. Update Firebase index silently
      indexJobs(walletAddress).catch(err => console.error("[useEscrow] Index update failed", err));

      // Track performance
      perfMonitor.trackApiCall("loadJobs", performance.now() - startTime, true);

    } catch (e) {
      console.error("loadJobs error:", e);
      perfMonitor.trackApiCall("loadJobs", performance.now() - startTime, false);
      perfMonitor.trackError(e.message, "loadJobs");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [walletAddress, fetchJobById, jobs]);

  /** Load next page of jobs (for infinite scroll) */
  const loadMoreJobs = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPage = Math.floor(loadedCount / JOBS_PAGE_SIZE);
    await loadJobs(false, nextPage);
  }, [hasMore, loading, loadedCount, loadJobs]);

  useEffect(() => {
    if (walletAddress) loadJobs();
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePostJob = async (title, description, amount, tokenSymbol = "XLM", milestones = null) => {
    if (!title.trim()) throw new Error("Please enter a job title!");
    if (!description.trim()) throw new Error("Please enter a description!");
    
    const token = SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol) || SUPPORTED_TOKENS[0];
    const TOKEN_CONTRACT = token.contract;

    const val = parseFloat(amount);
    if (!val || val <= 0) throw new Error(`Please enter a valid ${tokenSymbol} amount!`);
    
    const amountStroops = Math.round(val * 10_000_000);
    const ledgerInfo = await SOROBAN_SERVER.getLatestLedger();
    const EXPIRY_LEDGER = ledgerInfo.sequence + 500;
    setLoading(true);
    
    try {
      showStatus(`Step 1 of 2: Approving ${tokenSymbol} transfer...`, "info");
      const approveAccount = await SOROBAN_SERVER.getAccount(walletAddress);
      const approveTx = new StellarSdk.TransactionBuilder(approveAccount, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(TOKEN_CONTRACT).call(
          "approve",
          new StellarSdk.Address(walletAddress).toScVal(),
          new StellarSdk.Address(ESCROW_CONTRACT_ID).toScVal(),
          StellarSdk.nativeToScVal(amountStroops, { type: "i128" }),
          StellarSdk.nativeToScVal(EXPIRY_LEDGER, { type: "u32" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(approveTx, walletType, "approve", showStatus);

      showStatus(`Step 2 of 2: Posting job in ${tokenSymbol}...`, "info");
      const postAccount = await SOROBAN_SERVER.getAccount(walletAddress);
      const postTx = new StellarSdk.TransactionBuilder(postAccount, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "post_job",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(title.trim(), { type: "string" }),
          StellarSdk.nativeToScVal(description.trim(), { type: "string" }),
          StellarSdk.nativeToScVal(amountStroops, { type: "i128" }),
          new StellarSdk.Address(TOKEN_CONTRACT).toScVal()
        ))
        .setTimeout(300).build();
      await buildSignSubmit(postTx, walletType, "post_job", showStatus);

      showStatus(`✅ Job posted successfully in ${tokenSymbol}!`, "success");

      // Invalidate cache after mutation
      cacheManager.invalidate("escrow");

      await recordActivity(walletAddress, {
        type: "job_posted",
        title: "Job Posted",
        description: `Posted "${title.trim()}" for ${val} ${tokenSymbol}`,
        color: "#6366f1"
      });
      await loadJobs();
      return true;
    } catch (e) {
      let msg = e.message;
      if (msg.includes("trustline entry is missing")) {
        msg = `You need to add a trustline for ${tokenSymbol} before you can use it!`;
      }
      showStatus(`❌ ${msg}`, "error");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId) => {
    setLoading(true);
    try {
      const account = await SOROBAN_SERVER.getAccount(walletAddress);
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "accept_job",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(jobId, { type: "u32" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(tx, walletType, "accept_job", showStatus);
      showStatus(" Job accepted!", "success");
      
      cacheManager.invalidate("escrow");
      
      const acceptedJob = jobs.find(j => j.id === jobId);
      await recordActivity(walletAddress, {
        type: "job_accepted",
        title: "Job Accepted",
        description: `Accepted job: "${acceptedJob?.title || jobId}"`,
        color: "#facc15"
      });
      await loadJobs();
    } catch (e) {
      showStatus(` ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async (jobId, url) => {
    if (!url || !url.trim()) throw new Error("Please provide a work URL!");
    setLoading(true);
    try {
      const account = await SOROBAN_SERVER.getAccount(walletAddress);
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "submit_work",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(jobId, { type: "u32" }),
          StellarSdk.nativeToScVal(url.trim(), { type: "string" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(tx, walletType, "submit_work", showStatus);
      showStatus(" Work submitted!", "success");
      
      cacheManager.invalidate("escrow");
      
      const submittedJob = jobs.find(j => j.id === jobId);
      await recordActivity(walletAddress, {
        type: "job_submitted",
        title: "Work Submitted",
        description: `Submitted work for: "${submittedJob?.title || jobId}"`,
        color: "#fb923c"
      });
      await loadJobs();
    } catch (e) {
      showStatus(` ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    setLoading(true);
    try {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) throw new Error("Job not found.");
      const freelancer = String(job.freelancer);
      const token = SUPPORTED_TOKENS.find(t => t.contract === String(job.token)) || SUPPORTED_TOKENS[0];
      const amountVal = (Number(job.amount) / 10_000_000).toFixed(2);

      showStatus("⏳ Releasing payment...", "info");
      const account = await SOROBAN_SERVER.getAccount(walletAddress);
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "approve_and_pay",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(jobId, { type: "u32" })
        ))
      .setTimeout(300).build();
      await buildSignSubmit(tx, walletType, "approve_and_pay", showStatus);

      await Promise.all([
        storeNotification(freelancer, walletAddress, ` Payment received: ${amountVal} ${token.symbol} for "${job.title}"`, String(job.title)),
        storeNotification(walletAddress, freelancer, ` Payment sent: ${amountVal} ${token.symbol} for "${job.title}"`, String(job.title)),
      ]);

      showStatus(` Payment sent to freelancer!`, "success");
      cacheManager.invalidate("escrow");
      
      await recordActivity(walletAddress, { type: "payment_released", title: "Payment Released", description: `Released ${amountVal} ${token.symbol} for "${job.title}"`, color: "#34d399" });
      await recordActivity(freelancer, { type: "payment_received", title: "Payment Received", description: `Received ${amountVal} ${token.symbol} for "${job.title}"`, color: "#34d399" });
      await loadJobs();
    } catch (e) {
      showStatus(` ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    setLoading(true);
    try {
      showStatus(" Cancelling job...", "info");
      const account = await SOROBAN_SERVER.getAccount(walletAddress);
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "cancel_job",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(jobId, { type: "u32" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(tx, walletType, "cancel_job", showStatus);
      showStatus(" Job cancelled!", "success");
      cacheManager.invalidate("escrow");
      await loadJobs();
    } catch (e) {
      showStatus(` ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrustline = async (tokenSymbol) => {
    setLoading(true);
    try {
      const token = SUPPORTED_TOKENS.find(t => t.symbol === tokenSymbol);
      if (!token || token.type === "native") throw new Error("Invalid token or native asset.");
      
      showStatus(`⏳ Creating trustline for ${tokenSymbol}...`, "info");
      const account = await SOROBAN_SERVER.getAccount(walletAddress);
      
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(StellarSdk.Operation.changeTrust({
          asset: new StellarSdk.Asset(token.code, token.issuer)
        }))
        .setTimeout(300).build();
        
      await buildSignSubmit(tx, walletType, `trust_${tokenSymbol}`, showStatus);
      showStatus(`✅ Trustline for ${tokenSymbol} created!`, "success");
      return true;
    } catch (e) {
      showStatus(`❌ ${e.message}`, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openJobsCount = jobs.filter(j => getStatusKey(j.status) === 0 || getStatusKey(j.status) === "Open").length;
  const myJobsCount = jobs.filter(j => String(j.client) === walletAddress || (String(j.freelancer) === walletAddress && String(j.freelancer) !== String(j.client))).length;

  return {
    jobs,
    loading,
    status,
    statusType,
    loadJobs,
    loadMoreJobs,
    hasMore,
    totalJobs,
    showStatus,
    handlePostJob,
    handleAcceptJob,
    handleSubmitWork,
    handleApproveJob,
    handleCancelJob,
    handleCreateTrustline,
    openJobsCount,
    myJobsCount,
  };
};
