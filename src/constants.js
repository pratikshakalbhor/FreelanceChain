import { Networks, rpc } from "@stellar/stellar-sdk";

export const NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";


export const ESCROW_CONTRACT_ID = "CBNGQSH743IQE7JMT3YFPC4J4LNO4B73HHP2NAHDGIPD3TVL6WI7A2S3";
// Native XLM Stellar Asset Contract (SAC) on testnet — used by true-escrow to lock/release XLM
export const NATIVE_XLM_TOKEN = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
// USDC on Testnet (Typical address for testing)
export const USDC_TOKEN = "CCW67Z7X7SREMQ6SKSYI2S6K26F76E36X33767SREMQ6SKSYI2S6K26F76E36"; 
// EURC on Testnet
export const EURC_TOKEN = "CDUHRU2P76REMQ6SKSYI2S6K26F76E36X33767SREMQ6SKSYI2S6K26F76E36";

export const SUPPORTED_TOKENS = [
  { symbol: "XLM", name: "Stellar Lumen", contract: NATIVE_XLM_TOKEN, icon: "🚀" },
  { symbol: "USDC", name: "USD Coin", contract: USDC_TOKEN, icon: "💵" },
  { symbol: "EURC", name: "Euro Coin", contract: EURC_TOKEN, icon: "💶" },
];

export const SOROBAN_SERVER = new rpc.Server(RPC_URL);