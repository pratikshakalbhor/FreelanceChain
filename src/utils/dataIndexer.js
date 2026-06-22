/**
 * FreelanceChain Data Indexer (Scalable)
 * src/utils/dataIndexer.js
 * 
 * Indexes Stellar blockchain data into Firebase for fast queries.
 * Now uses RequestQueue for rate-limited, deduplication-aware batch jobs.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import { ref, set, get } from "firebase/database";
import { rtdb } from "../firebase";
import { ESCROW_CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_SERVER } from "../constants";
import { sorobanQueue, PRIORITY } from "./requestQueue";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const INDEX_KEY = "indexed_data";
const BATCH_SIZE = 5; // Index in batches to avoid rate limiting

const sanitizeBigInt = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

/**
 * Fetch jobs in batches (prevents overwhelming Soroban RPC).
 * Uses sorobanQueue for rate limiting and deduplication.
 */
const fetchJobsBatched = async (walletAddress, total) => {
  const jobs = [];
  const dummyAccount = new StellarSdk.Account(walletAddress, "0");

  for (let batchStart = 1; batchStart <= total; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, total);
    const batchPromises = [];

    for (let id = batchStart; id <= batchEnd; id++) {
      batchPromises.push(
        sorobanQueue.enqueue(async () => {
          const jobTx = new StellarSdk.TransactionBuilder(dummyAccount, {
            fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
          })
            .addOperation(StellarSdk.Operation.invokeContractFunction({
              contract: ESCROW_CONTRACT_ID,
              function: "get_job",
              args: [StellarSdk.nativeToScVal(id, { type: "u32" })],
            }))
            .setTimeout(30).build();

          const sim = await SOROBAN_SERVER.simulateTransaction(jobTx);
          if (sim?.result?.retval) {
            const rawJob = StellarSdk.scValToNative(sim.result.retval);
            const job = sanitizeBigInt(rawJob);
            return { ...job, id, indexedAt: Date.now() };
          }
          return null;
        }, { key: `index_job:${id}`, priority: PRIORITY.LOW })
          .catch(() => null)
      );
    }

    const batchResults = await Promise.all(batchPromises);
    jobs.push(...batchResults.filter(Boolean));
  }

  return jobs;
};


// ── Index all Jobs from escrow contract → Firebase ────────────────────────
export const indexJobs = async (walletAddress) => {
  if (!walletAddress) return;
  try {
    const dummy = new StellarSdk.Account(walletAddress, "0");

    const totalTx = new StellarSdk.TransactionBuilder(dummy, {
      fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.invokeContractFunction({
        contract: ESCROW_CONTRACT_ID,
        function: "get_total",
        args: [],
      }))
      .setTimeout(30).build();

    const totalSim = await sorobanQueue.enqueue(
      () => SOROBAN_SERVER.simulateTransaction(totalTx),
      { key: "index_get_total", priority: PRIORITY.LOW }
    );
    if (!totalSim?.result?.retval) return;
    const total = Number(StellarSdk.scValToNative(totalSim.result.retval));

    // Fetch all jobs in rate-limited batches
    const jobs = await fetchJobsBatched(walletAddress, total);

    // Save to Firebase index
    const jobIndexRef = ref(rtdb, `${INDEX_KEY}/jobs`);
    const jobMap = {};
    jobs.forEach(job => { jobMap[`job_${job.id}`] = job; });
    await set(jobIndexRef, {
      data: jobMap,
      total,
      lastIndexed: Date.now(),
    });

    console.log(`[Indexer] Indexed ${jobs.length} Jobs (batched, rate-limited)`);
    return jobs;
  } catch (e) {
    console.error("[Indexer] Job indexing error:", e);
    return [];
  }
};

// ── Index recent transactions from Horizon ────────────────────────────────
export const indexTransactions = async (walletAddress) => {
  if (!walletAddress) return;
  try {
    const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

    const txResponse = await horizonServer.transactions()
      .forAccount(walletAddress)
      .order("desc")
      .limit(50)
      .call();

    const txs = (txResponse.records || []).map(tx => ({
      hash: tx.hash,
      createdAt: tx.created_at,
      successful: tx.successful,
      operationCount: tx.operation_count,
      feeCharged: tx.fee_charged,
      indexedAt: Date.now(),
    }));

    const txIndexRef = ref(rtdb, `${INDEX_KEY}/transactions/${walletAddress.slice(0, 8)}`);
    await set(txIndexRef, {
      data: txs,
      lastIndexed: Date.now(),
    });

    console.log(`[Indexer] Indexed ${txs.length} transactions`);
    return txs;
  } catch (e) {
    console.error("[Indexer] TX indexing error:", e);
    return [];
  }
};



export const readIndexedJobs = async () => {
  try {
    const snap = await get(ref(rtdb, `${INDEX_KEY}/jobs`));
    if (!snap.exists()) return null;
    const data = snap.val();
    return {
      jobs: Object.values(data.data || {}),
      total: data.total,
      lastIndexed: data.lastIndexed,
    };
  } catch { return null; }
};

// ── Full index run ────────────────────────────────────────────────────────
export const runFullIndex = async (walletAddress) => {
  console.log("[Indexer] Starting full index (scalable batch mode)...");
  const [jobs, txs] = await Promise.all([
    indexJobs(walletAddress),
    indexTransactions(walletAddress),
  ]);
  console.log("[Indexer] Full index complete:", { jobs: jobs?.length, txs: txs?.length });
  return { jobs, txs };
};

// ── Check if index is stale (older than 5 mins) ───────────────────────────
export const isIndexStale = async () => {
  try {
    const snap = await get(ref(rtdb, `${INDEX_KEY}/jobs/lastIndexed`));
    if (!snap.exists()) return true;
    const lastIndexed = snap.val();
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastIndexed > fiveMinutes;
  } catch { return true; }
};