# 🏗️ Architecture Document
## FreelanceChain — Stellar Powered Freelancer Marketplace

---

## 📋 Overview

A decentralized application (dApp) built on the **Stellar blockchain** that provides:
- Trustless freelancer escrow system
- XLM payments
- Real-time blockchain activity monitoring
- On-chain job management

**GitHub:** https://github.com/pratikshakalbhor/FreelanceChain
**Network:** Stellar Testnet

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 18)                      │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐    │
│  │Dashboard │  │ Payment  │  │  Jobs    │  │  Monitoring │    │
│  │   Page   │  │   Page   │  │  (Escrow)│  │    Page     │    │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘    │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Activity │  │ Profile  │  │   Chat   │                     │
│  │  Page    │  │  Page    │  │   Page   │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────────┐    ┌────────────────┐
│   Wallet    │    │  Stellar Horizon │    │    Firebase    │
│  Services   │    │      API         │    │   (Backend)    │
│             │    │                  │    │                │
│ • Freighter │    │ • Account data   │    │ • Chat messages│
│ • Albedo    │    │ • TX history     │    │ • Data caching │
│ • xBull     │    │ • Balance        │    │ • Notifications│
└─────────────┘    └──────────────────┘    └────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│               STELLAR BLOCKCHAIN (Testnet)                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  Escrow Contract                       │   │
│  │                                                        │   │
│  │  CBNGQSH743IQE7JMT3YFPC4J4LNO4B73HHP2NAHDGIPD3TVL6..   │   │
│  │                                                        │   │
│  │  Functions:                                            │   │
│  │  • post_job()                                          │   │
│  │  • accept_job()                                        │   │
│  │  • submit_work()                                       │   │
│  │  • approve_job()                                       │   │
│  │  • cancel_job()                                        │   │
│  │  • get_job()                                           │   │
│  │  • get_total()                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  Native XLM SAC: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2..    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Core Flows

### 1. XLM Payment Flow
```
Sender → Enter Receiver Address + Amount
                    ↓
         Build Stellar Transaction
                    ↓
         Sign with Wallet
                    ↓
         Submit to Horizon
                    ↓
         Transaction recorded on Blockchain
                    ↓
         Activity page updated
```

### 2. Freelancer Escrow Flow
```
CLIENT                              FREELANCER
  │                                      │
  │ TX 1: approve() on XLM SAC          │
  │ → Authorize escrow to pull XLM       │
  │                                      │
  │ TX 2: post_job(title, amount)        │
  │ → XLM locked in escrow contract      │
  │                                      │
  │                       accept_job()   │
  │                       ← Status: InProgress
  │                                      │
  │                       submit_work()  │
  │                       ← Work URL on-chain
  │                                      │
  │ approve_job()                        │
  │ → XLM released to freelancer ✅      │
  │                                      │
  ↓                                      ↓
Activity Updated                 XLM in Wallet
```

---

## 🗂️ Project Structure

```
stellar-new/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD Pipeline (FreelanceChain)
├── contract/
│   └── escrow_contract/
│       └── src/
│           └── lib.rs                # Escrow Soroban Contract (Rust)
├── src/
│   ├── components/
│   │   ├── Sidebar.js                # Navigation
│   │   ├── ProfilePage.js            # User profile and job statistics
│   │   └── WalletModal.js            # Wallet connection management
│   ├── context/
│   │   └── ThemeContext.js           # Global theme state
│   ├── pages/
│   │   ├── DashboardPage.js          # System overview and metrics
│   │   ├── PaymentPage.js            # Direct XLM transfers
│   │   ├── ActivityPage.js           # On-chain transaction history
│   │   ├── MonitoringPage.js         # Admin system health dashboard
│   │   └── EscrowPage.js             # Job board and escrow lifecycle
│   ├── utils/
│   │   ├── soroban.js                # Contract interaction layer
│   │   └── activityService.js        # Transaction tracking
│   ├── constants.js                  # Deployment addresses
│   └── App.js                        # Main application logic
```

---

## 🔐 Smart Contracts

### Escrow Contract
- **Contract ID:** `CBNGQSH743IQE7JMT3YFPC4J4LNO4B73HHP2NAHDGIPD3TVL6WI7A2S3`
- **Language:** Rust (Soroban SDK)
- **Network:** Stellar Testnet

| Function | Parameters | Description |
|----------|-----------|-------------|
| `post_job` | client, title, description, amount | Create job + lock XLM |
| `accept_job` | freelancer, job_id | Secure job |
| `submit_work` | freelancer, job_id, work_url | Proof of work submission |
| `approve_job` | client, job_id | Payment release |
| `cancel_job` | client, job_id | Refund XLM |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 |
| **Blockchain** | Stellar Testnet |
| **Smart Contracts** | Rust + Soroban SDK |
| **Wallets** | Freighter, Albedo, xBull |
| **Relay/Cache** | Firebase Realtime Database |
| **CI/CD** | GitHub Actions |
| **Hosting** | Vercel |

---

## ⚙️ CI/CD Pipeline

```
GitHub Push (Main/Develop)
    │
    ├── ✅ Run Tests (Jest)
    ├── ✅ Check Rust Contract (Cargo)
    ├── ✅ Build App (NPM)
    └── ✅ Deploy to Vercel (Production)
```

---

## 📊 Environment Variables

```env
REACT_APP_ESCROW_CONTRACT_ID=CBNGQSH743IQE7JMT3YFPC4J4LNO4B73HHP2NAHDGIPD3TVL6WI7A2S3
REACT_APP_NETWORK=TESTNET
```

---

*Built for Advanced Agentic Coding — FreelanceChain Platform Upgrade*
*Network: Stellar Testnet | June 2026*