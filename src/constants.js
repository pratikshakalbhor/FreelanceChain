import { Networks, rpc } from "@stellar/stellar-sdk";

export const NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const CONTRACT_ID ="CDO2EV5OOEETJCLOD23THRNRLMMWZXGIJ2VWIDW5IU5VYB6GSCQMTXF3"; 
export const ESCROW_CONTRACT_ID = "CB7AXJU7SPGJXS4IMJAMLHE32ZWEVOZK7ITKFWO4EN7MCYFI5RVN445B";

export const SOROBAN_SERVER = new rpc.Server(RPC_URL);