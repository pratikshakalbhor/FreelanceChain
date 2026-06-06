import { useState, useEffect, useCallback } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useWallet } from "../WalletContext";
import { signTransaction } from "../walletService";
import {
  NETWORK, NETWORK_PASSPHRASE,
  ESCROW_CONTRACT_ID,
  NATIVE_XLM_TOKEN, SOROBAN_SERVER,
} from "../constants";
import { storeNotification } from "../utils/notificationService";
import { recordActivity } from "../utils/activityService";
import { readIndexedJobs, indexJobs } from "../utils/dataIndexer";

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
    throw new Error("No wallet connected. Please connect Freighter, Albedo, or xBull first.");
  }
  onStatus(`⏳ ${label}: simulating transaction...`, "info");
  let simulation;
  try {
    simulation = await SOROBAN_SERVER.simulateTransaction(txUnsigned);
  } catch (e) {
    throw new Error(`${label} simulation failed: ${e.message}`);
  }
  if (StellarSdk.rpc.Api.isSimulationError(simulation)) {
    throw new Error(`${label} simulation error: ${simulation.error}`);
  }
  let assembled;
  try {
    assembled = StellarSdk.rpc.assembleTransaction(txUnsigned, simulation).build();
  } catch (e) {
    throw new Error(`${label} assembly failed: ${e.message}`);
  }
  onStatus(`✍️ ${label}: please sign in your wallet...`, "info");
  const signedXdr = await signTransaction(assembled.toXDR(), {
    walletType,
    network: NETWORK,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  if (!signedXdr) throw new Error(`${label}: signing cancelled.`);
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await SOROBAN_SERVER.sendTransaction(signedTx);
  if (response.status === "ERROR") {
    throw new Error(`${label} error: ${JSON.stringify(response.errorResult ?? response)}`);
  }
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await SOROBAN_SERVER.getTransaction(response.hash);
    if (poll.status === "SUCCESS") return { hash: response.hash, retval: poll.returnValue };
    if (poll.status === "FAILED") throw new Error(`${label} failed on-chain.`);
  }
  throw new Error(`${label} timed out. Hash: ${response.hash}`);
};

export const useEscrow = () => {
  const { walletAddress, walletType } = useWallet();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info");

  const showStatus = useCallback((msg, type = "info") => {
    setStatus(msg);
    setStatusType(type);
    if (type === "success") setTimeout(() => setStatus(""), 6000);
  }, []);

  const loadJobs = useCallback(async (silent = false) => {
    if (!walletAddress) return;
    
    // 1. Try to load from Firebase Cache first (Instant)
    if (!silent) {
      try {
        const cached = await readIndexedJobs();
        if (cached && cached.jobs.length > 0) {
          console.log("[useEscrow] Loading from cache...");
          setJobs(cached.jobs);
          // If cache is fresh enough, we might skip loading screen but still refresh in bg
        }
      } catch (e) {
        console.warn("[useEscrow] Cache read failed:", e);
      }
    }

    if (!silent) setLoading(true);

    try {
      const dummyAccount = new StellarSdk.Account(walletAddress, "0");
      
      // Get Total
      const totalTx = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(StellarSdk.Operation.invokeContractFunction({
          contract: ESCROW_CONTRACT_ID, function: "get_total", args: [],
        }))
        .setTimeout(30).build();
      
      const totalSim = await SOROBAN_SERVER.simulateTransaction(totalTx);
      if (!totalSim?.result?.retval) { 
        if (!silent) setJobs([]); 
        return; 
      }
      
      const total = Number(StellarSdk.scValToNative(totalSim.result.retval));
      if (!total) { 
        if (!silent) setJobs([]); 
        return; 
      }

      // 2. Parallel Fetch from Blockchain
      const jobPromises = Array.from({ length: total }, (_, i) => {
        const id = i + 1;
        return (async () => {
          try {
            const jobTx = new StellarSdk.TransactionBuilder(dummyAccount, {
              fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
            })
              .addOperation(StellarSdk.Operation.invokeContractFunction({
                contract: ESCROW_CONTRACT_ID, function: "get_job",
                args: [StellarSdk.nativeToScVal(id, { type: "u32" })],
              }))
              .setTimeout(30).build();
            const jobSim = await SOROBAN_SERVER.simulateTransaction(jobTx);
            if (jobSim?.result?.retval) {
              const job = StellarSdk.scValToNative(jobSim.result.retval);
              return { ...job, id };
            }
            return null;
          } catch (e) {
            console.error("Job load error", id, e);
            return null;
          }
        })();
      });

      const freshJobs = (await Promise.all(jobPromises)).filter(Boolean);
      setJobs(freshJobs);

      // 3. Update Cache silently
      indexJobs(walletAddress).catch(err => console.error("[useEscrow] Index update failed", err));

    } catch (e) {
      console.error("loadJobs error:", e);
      // Keep existing jobs if error
    } finally {
      if (!silent) setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) loadJobs();
  }, [walletAddress, loadJobs]);

  const handlePostJob = async (title, description, amount) => {
    if (!title.trim()) throw new Error("Please enter a job title!");
    if (!description.trim()) throw new Error("Please enter a description!");
    const xlm = parseFloat(amount);
    if (!xlm || xlm <= 0) throw new Error("Please enter a valid XLM amount!");
    
    const amountStroops = Math.round(xlm * 10_000_000);
    const ledgerInfo = await SOROBAN_SERVER.getLatestLedger();
    const EXPIRY_LEDGER = ledgerInfo.sequence + 500;
    setLoading(true);
    
    try {
      showStatus("Step 1 of 2: Approving XLM transfer...", "info");
      const approveAccount = await SOROBAN_SERVER.getAccount(walletAddress);
      const approveTx = new StellarSdk.TransactionBuilder(approveAccount, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(NATIVE_XLM_TOKEN).call(
          "approve",
          new StellarSdk.Address(walletAddress).toScVal(),
          new StellarSdk.Address(ESCROW_CONTRACT_ID).toScVal(),
          StellarSdk.nativeToScVal(amountStroops, { type: "i128" }),
          StellarSdk.nativeToScVal(EXPIRY_LEDGER, { type: "u32" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(approveTx, walletType, "approve", showStatus);

      showStatus("Step 2 of 2: Posting job...", "info");
      const postAccount = await SOROBAN_SERVER.getAccount(walletAddress);
      const postTx = new StellarSdk.TransactionBuilder(postAccount, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "post_job",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(title.trim(), { type: "string" }),
          StellarSdk.nativeToScVal(description.trim(), { type: "string" }),
          StellarSdk.nativeToScVal(amountStroops, { type: "i128" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(postTx, walletType, "post_job", showStatus);

      showStatus("✅ Job posted successfully!", "success");
      await recordActivity(walletAddress, {
        type: "job_posted",
        title: "Job Posted",
        description: `Posted "${title.trim()}" for ${xlm} XLM`,
        color: "#6366f1"
      });
      await loadJobs();
      return true;
    } catch (e) {
      showStatus(`❌ ${e.message}`, "error");
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
      const amountXLM = (Number(job.amount) / 10_000_000).toFixed(2);

      showStatus("⏳ Releasing payment...", "info");
      const account = await SOROBAN_SERVER.getAccount(walletAddress);
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000000", networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(new StellarSdk.Contract(ESCROW_CONTRACT_ID).call(
          "approve_job",
          new StellarSdk.Address(walletAddress).toScVal(),
          StellarSdk.nativeToScVal(jobId, { type: "u32" })
        ))
        .setTimeout(300).build();
      await buildSignSubmit(tx, walletType, "approve_job", showStatus);

      await Promise.all([
        storeNotification(freelancer, walletAddress, ` Payment received: ${amountXLM} XLM for "${job.title}"`, String(job.title)),
        storeNotification(walletAddress, freelancer, ` Payment sent: ${amountXLM} XLM for "${job.title}"`, String(job.title)),
      ]);

      showStatus(` Payment sent to freelancer!`, "success");
      await recordActivity(walletAddress, { type: "payment_released", title: "Payment Released", description: `Released ${amountXLM} XLM for "${job.title}"`, color: "#34d399" });
      await recordActivity(freelancer, { type: "payment_received", title: "Payment Received", description: `Received ${amountXLM} XLM for "${job.title}"`, color: "#34d399" });
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
      await loadJobs();
    } catch (e) {
      showStatus(` ${e.message}`, "error");
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
    showStatus,
    handlePostJob,
    handleAcceptJob,
    handleSubmitWork,
    handleApproveJob,
    handleCancelJob,
    openJobsCount,
    myJobsCount,
  };
};
