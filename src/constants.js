import { Networks, rpc } from "@stellar/stellar-sdk";

export const NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";


export const ESCROW_CONTRACT_ID = "CCPPAAJXTQGN3BTPYBN6TFX6DAMAC6R33QYPWJ2AD7WEL574LNTBDRWH";
// Native XLM Stellar Asset Contract (SAC) on testnet — used by true-escrow to lock/release XLM
export const NATIVE_XLM_TOKEN = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
// USDC on Testnet (Typical address for testing)
export const USDC_TOKEN = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
// EURC on Testnet
export const EURC_TOKEN = "CCUUDM434BMZMYWYDITHFXHDMIVTGGD6T2I5UKNX5BSLXLW7HVR4MCGZ";

export const SUPPORTED_TOKENS = [
  { 
    symbol: "XLM", name: "Stellar Lumen", 
    contract: NATIVE_XLM_TOKEN, icon: "🚀", 
    type: "native" 
  },
  { 
    symbol: "USDC", name: "USD Coin", 
    contract: USDC_TOKEN, icon: "💵", 
    type: "credit", 
    code: "USDC", 
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" 
  },
  { 
    symbol: "EURC", name: "Euro Coin", 
    contract: EURC_TOKEN, icon: "💶", 
    type: "credit", 
    code: "EURC", 
    issuer: "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO" 
  },
];

export const SOROBAN_SERVER = new rpc.Server(RPC_URL);