# 🌟 FreelanceChain
### Decentralized Freelancer Escrow Platform on Stellar

A full-stack decentralized application built on Stellar Testnet providing a trustless freelancer escrow system — **Fiverr on blockchain** with zero middleman fees and instant on-chain settlements.

---

## 🚀 Overview

FreelanceChain eliminates the need for trusted third parties in the freelancing economy. Clients lock payments in a Soroban smart contract, which are released automatically to freelancers only when work is submitted and approved.

- **Trustless Escrow**: Payments are secured on-chain, not in a company's bank account.
- **Zero Fees**: No platform commissions on your hard-earned XLM.
- **Instant Settlement**: Payments move the moment work is approved.
- **On-Chain Reputation**: Your work history is transparent and immutable.

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Wallet Support** | Freighter, Albedo, and xBull integration. | ✅ |
| **Escrow Smart Contract** | Robust Rust-based logic for job lifecycle. | ✅ |
| **XLM Payments** | Native asset transfers for direct hiring. | ✅ |
| **Real-time Monitoring** | Admin dashboard for system health and job metrics. | ✅ |
| **Activity Tracking** | Automated transaction history with type labels. | ✅ |
| **Cross-Platform** | Fully responsive glassmorphism UI. | ✅ |

---

## 🔄 How the Escrow Works

1.  **Job Posting**: Client locks XLM in the smart contract.
2.  **Job Acceptance**: Freelancer secures the job on-chain.
3.  **Submission**: Freelancer submits work URL to the contract.
4.  **Approval**: Client verifies work and releases payment instantly.

---

## 🏗️ Technical Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Framer Motion, Lucide Icons |
| **Blockchain** | Stellar Testnet (Soroban) |
| **Contracts** | Rust + Soroban SDK |
| **Backend** | Firebase Realtime Database (Notifications/Cache) |
| **CI/CD** | GitHub Actions |

---

## 🛠️ Setup & Development

### 1. Installation
```bash
git clone https://github.com/pratikshakalbhor/FreelanceChain
cd stellar-new
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root:
```env
REACT_APP_ESCROW_CONTRACT_ID=CBNGQSH743IQE7JMT3YFPC4J4LNO4B73HHP2NAHDGIPD3TVL6WI7A2S3
REACT_APP_NETWORK=TESTNET
```

### 3. Execution
```bash
npm start
```

---

## ⚙️ CI/CD Pipeline

The project features a fully automated CI/CD pipeline via GitHub Actions that handles:
- **Unit Testing**: Ensures component and utility stability.
- **WASM Check**: Verifies the integrity of the Rust smart contract.
- **Production Build**: Generates optimized assets.
- **Continuous Deployment**: Auto-deploys to Vercel on every push to `main`.

---

## 🔗 Project Links

- **Architecture Document**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Stellar Expert**: [Verify Contract on Testnet](https://stellar.expert/explorer/testnet/contract/CBNGQSH743IQE7JMT3YFPC4J4LNO4B73HHP2NAHDGIPD3TVL6WI7A2S3)

---

*Built for the Stellar ecosystem. FreelanceChain is a secure, open-source solution for the future of work.*
