# 🏗️ Architecture Document
## Stellar NFT dApp + Freelancer Escrow Platform

---

## 📋 Overview

A decentralized application (dApp) built on the **Stellar blockchain** that combines:
- NFT minting and marketplace
- XLM payments
- Trustless freelancer escrow system with NFT certificates

**Live Demo:** https://nft-based-dapp.vercel.app
**GitHub:** https://github.com/pratikshakalbhor/NFT_Based-dapp
**Network:** Stellar Testnet
**Demo Video:** [Add Loom video link here]

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 18)                      │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Dashboard │  │ Payment  │  │  Jobs    │  │  Mint NFT  │  │
│  │   Page   │  │   Page   │  │  (Escrow)│  │    Page    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Gallery  │  │Marketplace│ │ Activity │  │  Profile   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────────┐    ┌────────────────┐
│   Wallet    │    │  Stellar Horizon │    │      IPFS      │
│  Services   │    │      API         │    │    (Pinata)    │
│             │    │                  │    │                │
│ • Freighter │    │ • Account data   │    │ • NFT Images   │
│ • Albedo    │    │ • TX history     │    │ • Work files   │
│ • xBull     │    │ • Balance        │    │ • Metadata     │
└─────────────┘    └──────────────────┘    └────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│               STELLAR BLOCKCHAIN (Testnet)                    │
│                                                               │
│  ┌──────────────────────┐   ┌──────────────────────────┐    │
│  │    NFT Contract      │   │     Escrow Contract       │    │
│  │                      │   │                           │    │
│  │ CBDU5YGABADUI3VFA..  │   │ CCDPX32SM7NZR7NF6L5L..   │    │
│  │                      │   │                           │    │
│  │ Functions:           │   │ Functions:                │    │
│  │ • mint_nft()         │   │ • post_job()              │    │
│  │ • get_nft()          │   │ • accept_job()            │    │
│  │ • get_total()        │   │ • submit_work()           │    │
│  │ • balance()          │   │ • approve_job()           │    │
│  │ • get_owner()        │   │ • cancel_job()            │    │
│  │ • get_name()         │   │ • get_job()               │    │
│  │ • get_image()        │   │ • get_total()             │    │
│  └──────────────────────┘   └──────────────────────────┘    │
│                                                               │
│  Native XLM SAC: CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2.. │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Core Flows

### 1. NFT Minting Flow
```
User → Upload Image → IPFS (Pinata)
                          ↓
                    Get IPFS CID
                          ↓
               Call mint_nft() on NFT Contract
               (minter, owner, name, image_url)
                          ↓
               Wallet Sign Transaction (Freighter/Albedo)
                          ↓
               Submit via Soroban RPC
                          ↓
               NFT stored on Stellar Blockchain
                          ↓
               Appears in Gallery + Marketplace
```

### 2. XLM Payment Flow
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

### 3. Freelancer Escrow Flow (Main Feature)
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
  │ → NFT Certificate minted ✅          │
  │                                      │
  ↓                                      ↓
Activity Updated                 NFT in Gallery
                                 XLM in Wallet
```

---

## 🗂️ Project Structure

```
stellar-new/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD Pipeline
├── backend/
│   ├── server.js                     # Express backend (IPFS proxy)
│   └── package.json
├── contract/
│   └── escrow_contract/
│       └── src/
│           └── lib.rs                # Escrow Soroban Contract (Rust)
│   └── token/                        # Token contract
├── src/
│   ├── components/
│   │   ├── Sidebar.js                # Navigation (Jobs, Payment, etc.)
│   │   ├── ProfilePage.js            # Full profile with jobs stats
│   │   ├── Background.js             # Animated background
│   │   └── WalletModal.js            # Wallet connect modal
│   ├── context/
│   │   └── ThemeContext.js           # Dark/Light theme
│   ├── pages/
│   │   ├── DashboardPage.js          # Overview + stats + recent TXs
│   │   ├── PaymentPage.js            # XLM payments
│   │   ├── MintPage.js               # NFT minting via IPFS
│   │   ├── GalleryPage.js            # NFT gallery
│   │   ├── MarketplacePage.js        # NFT marketplace (buy/sell)
│   │   ├── ActivityPage.js           # Transaction history + filters
│   │   └── EscrowPage.js             # Jobs (Post/Accept/Submit/Approve)
│   ├── utils/
│   │   ├── soroban.js                # Contract interactions
│   │   └── errorHandler.js           # Error handling
│   ├── App.js                        # Main app + routing
│   ├── WalletContext.js              # Wallet state management
│   ├── walletService.js              # Wallet connections (Freighter/Albedo/xBull)
│   └── constants.js                  # Contract IDs + config
└── docs/
    ├── ARCHITECTURE.md               # This document
    └── User_Feedback_Documentation.docx
```

---

## 🔐 Smart Contracts

### NFT Contract
- **Contract ID:** `CBDU5YGABADUI3VFARIEQVJAAL3LASUNDEO2M2XCWYDTTUH47ENDAYPB`
- **Language:** Rust (Soroban SDK)
- **Network:** Stellar Testnet

| Function | Parameters | Description |
|----------|-----------|-------------|
| `mint_nft` | minter, owner, name, image_url | Mint new NFT |
| `get_nft` | id | Get NFT details |
| `get_total` | — | Total NFTs minted |
| `balance` | user | NFTs owned by user |
| `get_owner` | id | NFT owner address |

### Escrow Contract
- **Contract ID:** `CCDPX32SM7NZR7NF6L5LMJE7X46EOE3X7ZGHWAQFGTUIFDXV5GKHV4ZP`
- **Language:** Rust (Soroban SDK)
- **Network:** Stellar Testnet

| Function | Parameters | Description |
|----------|-----------|-------------|
| `post_job` | client, title, description, amount | Post job + lock XLM |
| `accept_job` | freelancer, job_id | Accept open job |
| `submit_work` | freelancer, job_id, work_url | Submit work URL |
| `approve_job` | client, job_id | Approve + release XLM |
| `cancel_job` | client, job_id | Cancel + refund XLM |
| `get_job` | job_id | Get job details |
| `get_total` | — | Total jobs count |

### Native XLM SAC
- **Address:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- Used for XLM approve + transfer in escrow flow

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 |
| **Blockchain** | Stellar Testnet |
| **Smart Contracts** | Rust + Soroban SDK |
| **Wallet** | Freighter, Albedo, xBull |
| **Storage** | IPFS via Pinata |
| **Styling** | Tailwind CSS + Inline styles |
| **Animations** | Framer Motion |
| **Backend** | Node.js + Express |
| **CI/CD** | GitHub Actions |
| **Hosting** | Vercel |
| **SDK** | @stellar/stellar-sdk |

---

## 🌐 API & Services

### Soroban RPC
```
URL: https://soroban-testnet.stellar.org
Used for:
- Smart contract calls (post_job, mint_nft, etc.)
- Contract simulation (prepareTransaction)
- Submit Soroban transactions (sendTransaction)
- Poll confirmation (getTransaction)
```

### Stellar Horizon API
```
URL: https://horizon-testnet.stellar.org
Used for:
- Account balance + sequence number
- Transaction history (Activity page)
- XLM Payment submission
```

### IPFS (Pinata)
```
Used for:
- NFT image upload
- Work submission files
- Decentralized file hosting
Gateway: https://gateway.pinata.cloud/ipfs/
```

---

## 🔑 Key Technical Decisions

### Soroban RPC vs Horizon
- **Soroban contract calls** → always use `rpc.Server` (`sendTransaction`)
- **XLM payments + account data** → use `Horizon.Server`
- Mixing these caused the original bug — now fixed

### Albedo Signing Fix
```javascript
// Albedo requires lowercase network name
const albedoNetwork = network.toLowerCase() === "testnet" ? "testnet" : "public";
await albedo.tx({ xdr, network: albedoNetwork, submit: false });
return res.signed_envelope_xdr;
```

### Two-Step XLM Locking
```javascript
// Step 1: approve() on XLM SAC — authorize escrow to pull XLM
// Step 2: post_job() — escrow pulls XLM via token.transfer()
// expiry = current_ledger + 500 (dynamic, not hardcoded)
```

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| **Wallet Auth** | `require_auth()` in every contract function |
| **XLM Escrow** | Locked in contract, released only on `approve_job` |
| **No Centralized DB** | All data on Stellar blockchain |
| **Multi-wallet** | Freighter + Albedo + xBull |
| **HTTPS** | Vercel SSL |
| **Popup Security** | `submit: false` — never auto-submit via Albedo |

---

## ⚙️ CI/CD Pipeline

```
GitHub Push
    │
    ├── ✅ Run Tests
    ├── ✅ Build App (npm run build)
    ├── ✅ Check Rust Contract (cargo check)
    └── ✅ Deploy to Vercel (auto)
```

---

## 📊 Environment Variables

```
REACT_APP_CONTRACT_ID=CBDU5YGABADUI3VFARIEQVJAAL3LASUNDEO2M2XCWYDTTUH47ENDAYPB
REACT_APP_ESCROW_CONTRACT_ID=CCDPX32SM7NZR7NF6L5LMJE7X46EOE3X7ZGHWAQFGTUIFDXV5GKHV4ZP
REACT_APP_NETWORK=TESTNET
PINATA_API_KEY=<secret>
PINATA_SECRET_KEY=<secret>
```

---

## 👥 User Journey

### For Client (Job Poster):
1. Connect Freighter/Albedo wallet
2. Go to **Jobs** → Post Job
3. Enter title, description, XLM amount
4. Sign 2 transactions (approve XLM + post job)
5. XLM locked in smart contract
6. Review submitted work URL
7. Click **Approve & Release Payment** → XLM sent automatically

### For Freelancer:
1. Connect wallet
2. Go to **Jobs** → Find Jobs
3. Accept available job
4. Do the work, upload to IPFS
5. Submit work URL on-chain
6. Receive XLM + NFT Certificate automatically

### NFT Certificate Flow:
```
Job Approved → mint_nft() called automatically
             → Certificate NFT in Freelancer's Gallery
             → Can list on Marketplace as proof of work
```

---

## 📈 User Feedback & Iterations

### Feedback Summary (5 Users)
- Average Rating: **4.6 / 5.0**
- Most liked: Zero middleman fees, NFT Certificate feature
- Key issue fixed: Albedo popup not opening (network case bug)

### Iteration 1 (Completed)
- Fixed Albedo signing (`TESTNET` → `testnet`)
- Renamed "Escrow" → "Jobs" in sidebar
- Added transaction type labels in Activity page
- Fixed Dashboard jobs count (now fetches from contract)
- Added Certificate badge in Marketplace

---

*Built for Rise In Stellar Quest — Level 5 Blue Belt*
*Network: Stellar Testnet | March 2026*