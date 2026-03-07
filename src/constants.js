import { Networks, rpc } from "@stellar/stellar-sdk";

export const NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const CONTRACT_ID ="CDAV2WZS3H7TUM2QS7TQMQFI66EULYC7BD7NPPJYYNODCY4RLVHDT66D"; // <--- PASTE THE NEW ID HERE

export const SOROBAN_SERVER = new rpc.Server(RPC_URL);