# 🌟 Decentralized Freelancer Escrow Platform
### Level 5 — Blue Belt Submission | Rise In Stellar Quest

A full-stack decentralized application built on Stellar Testnet combining NFT minting, XLM payments, and a trustless freelancer escrow system — like **Fiverr on blockchain** with zero middleman fees.

---

## 🚀 Live Demo & Video

| | Link |
|---|---|
| 🌐 **Live Demo** | https://nft-based-dapp.vercel.app |
| 📹 **Demo Video** | [Add Loom video link here] |
| 📂 **GitHub** | https://github.com/pratikshakalbhor/NFT_Based-dapp |

---

## 💡 What is this?

> A client posts a job and locks XLM in a smart contract. A freelancer accepts, does the work, and submits a URL. The client approves → XLM is released automatically + NFT Certificate is minted for the freelancer as proof of work. Zero middleman. Zero trust required.

---

## ✨ Features

| Feature | Level | Status |
|---------|-------|--------|
| Wallet Connect (Freighter + Albedo + xBull) | L1 | ✅ |
| XLM Payments | L1 | ✅ |
| Mint NFT via Soroban + IPFS | L2 | ✅ |
| NFT Gallery + Search | L2 | ✅ |
| NFT Marketplace (Buy/Sell for XLM) | L2 | ✅ |
| Activity Feed with TX type labels | L2 | ✅ |
| 39 Unit Tests | L3 | ✅ |
| CI/CD Pipeline | L4 | ✅ |
| Custom SNFT Token + Inter-contract calls | L4 | ✅ |
| Mobile Responsive | L4 | ✅ |
| **Freelancer Escrow System** | **L5** | ✅ |
| **Auto NFT Certificate on job completion** | **L5** | ✅ |
| **Full Profile with reputation score** | **L5** | ✅ |
| **5+ Real Testnet Users** | **L5** | ✅ |
| **User Feedback + Iteration** | **L5** | ✅ |

---

## 👥 Testnet Users (5+ Real Users)



---

## 📝 User Feedback Summary



📄 **Full Feedback Document:** [docs/User_Feedback_Documentation.docx](docs/User_Feedback_Documentation.docx)

---

## 🔄 Iteration (Based on Feedback)

| Feedback | Change Made | Status |
|----------|------------|--------|
| Albedo popup not opening | Fixed network param: `"TESTNET"` → `"testnet"` | ✅ Done |
| "Escrow" name confusing | Renamed to "Jobs" in Sidebar | ✅ Done |
| TX type not visible in Activity | Added NFT/Payment/Job labels with icons | ✅ Done |
| Dashboard Jobs count = 0 | Fixed: fetches real count from Soroban contract | ✅ Done |
| Add chat feature | Planned for Level 6 | 🔄 Planned |

---

## 🏗️ How the Escrow Works

```
CLIENT                              FREELANCER
  │                                      │
  │ 1. approve() XLM SAC                 │
  │ 2. post_job() → XLM locked           │
  │                                      │
  │                    3. accept_job()   │
  │                    4. submit_work()  │
  │                                      │
  │ 5. approve_job()                     │
  │    → XLM released ✅                 │
  │    → NFT Certificate minted ✅       │
```

---

## 🔐 Smart Contracts

### NFT Contract
- **ID:** `CBDU5YGABADUI3VFARIEQVJAAL3LASUNDEO2M2XCWYDTTUH47ENDAYPB`
- Functions: `mint_nft`, `get_nft`, `get_total`, `balance`, `get_owner`

### Escrow Contract
- **ID:** `CCDPX32SM7NZR7NF6L5LMJE7X46EOE3X7ZGHWAQFGTUIFDXV5GKHV4ZP`
- Functions: `post_job`, `accept_job`, `submit_work`, `approve_job`, `cancel_job`, `get_job`, `get_total`

### Native XLM SAC
- **Address:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Blockchain | Stellar Testnet (Soroban) |
| Smart Contracts | Rust + Soroban SDK |
| Wallets | Freighter, Albedo, xBull |
| Storage | IPFS via Pinata |
| SDK | @stellar/stellar-sdk |
| Backend | Node.js + Express |
| CI/CD | GitHub Actions |
| Hosting | Vercel |
| Testing | Jest (39 tests) |

---

## ⚙️ Setup & Run

### 1. Clone & Install
```bash
git clone https://github.com/pratikshakalbhor/NFT_Based-dapp
cd stellar-new
npm install
```

### 2. Environment Variables
```env
REACT_APP_CONTRACT_ID=CBDU5YGABADUI3VFARIEQVJAAL3LASUNDEO2M2XCWYDTTUH47ENDAYPB
REACT_APP_ESCROW_CONTRACT_ID=CCDPX32SM7NZR7NF6L5LMJE7X46EOE3X7ZGHWAQFGTUIFDXV5GKHV4ZP
REACT_APP_NETWORK=TESTNET
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

### 3. Run
```bash
# Backend (IPFS proxy)
cd backend && node server.js

# Frontend
npm start
```

### 4. Tests
```bash
npm test
# 39 tests passing ✅
```

---

## 📱 Mobile Responsive
<img width="1141" height="852" alt="Screenshot 2026-03-09 213008" src="https://github.com/user-attachments/assets/645c0b85-969f-4afc-bcec-c43500e15d3a" />

## ⚙️ CI/CD Pipeline
<img width="1482" height="592" alt="image" src="https://github.com/user-attachments/assets/bb306b8d-fed8-4fb8-93bb-8d22c4af2edc" />

---

## 📸 Screenshots

### Dashboard
<img width="1919" height="910" alt="Dashboard" src="https://github.com/user-attachments/assets/697ae705-0ad6-422c-bfd6-cbfbf797f6b0" />

### Jobs (Escrow) — Post Job
# 🌟 Decentralized Freelancer Escrow Platform
### Level 5 — Blue Belt Submission | Rise In Stellar Quest

A full-stack decentralized application built on Stellar Testnet combining NFT minting, XLM payments, and a trustless freelancer escrow system — like **Fiverr on blockchain** with zero middleman fees.

---

## 🚀 Live Demo & Video

| | Link |
|---|---|
| 🌐 **Live Demo** | https://nft-based-dapp.vercel.app |
| 📹 **Demo Video** | [Add Loom video link here] |
| 📂 **GitHub** | https://github.com/pratikshakalbhor/NFT_Based-dapp |

---

## 💡 What is this?

> A client posts a job and locks XLM in a smart contract. A freelancer accepts, does the work, and submits a URL. The client approves → XLM is released automatically + NFT Certificate is minted for the freelancer as proof of work. Zero middleman. Zero trust required.

---

## ✨ Features

| Feature | Level | Status |
|---------|-------|--------|
| Wallet Connect (Freighter + Albedo + xBull) | L1 | ✅ |
| XLM Payments | L1 | ✅ |
| Mint NFT via Soroban + IPFS | L2 | ✅ |
| NFT Gallery + Search | L2 | ✅ |
| NFT Marketplace (Buy/Sell for XLM) | L2 | ✅ |
| Activity Feed with TX type labels | L2 | ✅ |
| 39 Unit Tests | L3 | ✅ |
| CI/CD Pipeline | L4 | ✅ |
| Custom SNFT Token + Inter-contract calls | L4 | ✅ |
| Mobile Responsive | L4 | ✅ |
| **Freelancer Escrow System** | **L5** | ✅ |
| **Auto NFT Certificate on job completion** | **L5** | ✅ |
| **Full Profile with reputation score** | **L5** | ✅ |
| **5+ Real Testnet Users** | **L5** | ✅ |
| **User Feedback + Iteration** | **L5** | ✅ |

---

## 👥 Testnet Users (5+ Real Users)


> All transactions verifiable on [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet)

---

## 📝 User Feedback Summary



📄 **Full Feedback Document:** [docs/User_Feedback_Documentation.docx](docs/User_Feedback_Documentation.docx)

---

## 🔄 Iteration (Based on Feedback)

| Feedback | Change Made | Status |
|----------|------------|--------|
| Albedo popup not opening | Fixed network param: `"TESTNET"` → `"testnet"` | ✅ Done |
| "Escrow" name confusing | Renamed to "Jobs" in Sidebar | ✅ Done |
| TX type not visible in Activity | Added NFT/Payment/Job labels with icons | ✅ Done |
| Dashboard Jobs count = 0 | Fixed: fetches real count from Soroban contract | ✅ Done |
| Add chat feature | Planned for Level 6 | 🔄 Planned |

---

## 🏗️ How the Escrow Works

```
CLIENT                              FREELANCER
  │                                      │
  │ 1. approve() XLM SAC                 │
  │ 2. post_job() → XLM locked           │
  │                                      │
  │                    3. accept_job()   │
  │                    4. submit_work()  │
  │                                      │
  │ 5. approve_job()                     │
  │    → XLM released ✅                 │
  │    → NFT Certificate minted ✅       │
```

---

## 🔐 Smart Contracts

### NFT Contract
- **ID:** `CBDU5YGABADUI3VFARIEQVJAAL3LASUNDEO2M2XCWYDTTUH47ENDAYPB`
- Functions: `mint_nft`, `get_nft`, `get_total`, `balance`, `get_owner`

### Escrow Contract
- **ID:** `CCDPX32SM7NZR7NF6L5LMJE7X46EOE3X7ZGHWAQFGTUIFDXV5GKHV4ZP`
- Functions: `post_job`, `accept_job`, `submit_work`, `approve_job`, `cancel_job`, `get_job`, `get_total`

### Native XLM SAC
- **Address:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion |
| Blockchain | Stellar Testnet (Soroban) |
| Smart Contracts | Rust + Soroban SDK |
| Wallets | Freighter, Albedo, xBull |
| Storage | IPFS via Pinata |
| SDK | @stellar/stellar-sdk |
| Backend | Node.js + Express |
| CI/CD | GitHub Actions |
| Hosting | Vercel |
| Testing | Jest (39 tests) |

---

## ⚙️ Setup & Run

### 1. Clone & Install
```bash
git clone https://github.com/pratikshakalbhor/NFT_Based-dapp
cd stellar-new
npm install
```

### 2. Environment Variables
```env
REACT_APP_CONTRACT_ID=CBDU5YGABADUI3VFARIEQVJAAL3LASUNDEO2M2XCWYDTTUH47ENDAYPB
REACT_APP_ESCROW_CONTRACT_ID=CCDPX32SM7NZR7NF6L5LMJE7X46EOE3X7ZGHWAQFGTUIFDXV5GKHV4ZP
REACT_APP_NETWORK=TESTNET
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
```

### 3. Run
```bash
# Backend (IPFS proxy)
cd backend && node server.js

# Frontend
npm start
```

### 4. Tests
```bash
npm test
# 39 tests passing ✅
```

---

## 📱 Mobile Responsive
<img width="1141" height="852" alt="Screenshot 2026-03-09 213008" src="https://github.com/user-attachments/assets/645c0b85-969f-4afc-bcec-c43500e15d3a" />

## ⚙️ CI/CD Pipeline
<img width="1482" height="592" alt="image" src="https://github.com/user-attachments/assets/bb306b8d-fed8-4fb8-93bb-8d22c4af2edc" />

---

## 📸 Screenshots

### Dashboard
<img width="1919" height="910" alt="Dashboard" src="https://github.com/user-attachments/assets/697ae705-0ad6-422c-bfd6-cbfbf797f6b0" />

### Jobs (Escrow) — Post Job
<img width="1875" height="900" alt="Jobs Page" src="https://github.com/user-attachments/assets/524bd36d-b08f-494d-977c-81babc3d3553" />

### Payment
<img width="1880" height="900" alt="Payment" src="https://github.com/user-attachments/assets/0a16ef55-565b-46a7-9ad1-4acaa54b6bf1" />

### NFT Minting
<img width="1919" height="910" alt="Mint NFT" src="https://github.com/user-attachments/assets/697ae705-0ad6-422c-bfd6-cbfbf797f6b0" />

### NFT Gallery
<img width="1867" height="891" alt="Gallery" src="https://github.com/user-attachments/assets/a35c0b5a-5cea-4e46-b1e8-b26fdf6a7ff5" />

### Marketplace
<img width="1870" height="888" alt="Marketplace" src="https://github.com/user-attachments/assets/782d0e73-f85b-4428-b752-3b99d2f6323f" />

### Activity Feed
<img width="1872" height="908" alt="Activity" src="https://github.com/user-attachments/assets/2ea9acd0-8f5a-49b2-ba86-40ed79a21208" />

### Profile Page
<img width="1872" height="895" alt="Profile" src="https://github.com/user-attachments/assets/67366ba0-c627-471b-802d-54a344557a2e" />

---

## 🪙 Custom Token — SNFT

| Property | Value |
|----------|-------|
| Name | Stellar NFT Token |
| Symbol | SNFT |
| Network | Stellar Testnet |
| Reward per Mint | 10 SNFT |
| Contract Type | Soroban |

---

## 📁 Project Structure

```
stellar-new/
├── .github/workflows/ci.yml       # CI/CD
├── backend/server.js               # IPFS proxy
├── contract/escrow_contract/
│   └── src/lib.rs                  # Escrow Contract (Rust)
├── src/
│   ├── pages/
│   │   ├── DashboardPage.js        # Overview + stats
│   │   ├── EscrowPage.js           # Jobs (Escrow)
│   │   ├── MintPage.js             # NFT minting
│   │   ├── GalleryPage.js          # NFT gallery
│   │   ├── MarketplacePage.js      # Buy/Sell NFTs
│   │   ├── ActivityPage.js         # TX history
│   │   └── PaymentPage.js          # XLM payments
│   ├── components/
│   │   ├── Sidebar.js              # Navigation
│   │   └── ProfilePage.js          # Full profile
│   ├── walletService.js            # Wallet connections
│   └── constants.js                # Contract IDs
└── docs/
    ├── ARCHITECTURE.md             # Architecture document
    └── User_Feedback_Documentation.docx
```

---

## 🔗 Useful Links

- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet)
- [Friendbot — Fund Account](https://friendbot.stellar.org)
- [Soroban Docs](https://soroban.stellar.org)
- [Architecture Document](docs/ARCHITECTURE.md)
- [User Feedback](docs/User_Feedback_Documentation.docx)

---

*Built for Rise In Stellar Quest — Level 5 Blue Belt | March 2026*
### Payment
<img width="1880" height="900" alt="Payment" src="https://github.com/user-attachments/assets/0a16ef55-565b-46a7-9ad1-4acaa54b6bf1" />

### NFT Minting
<img width="1919" height="910" alt="Mint NFT" src="https://github.com/user-attachments/assets/697ae705-0ad6-422c-bfd6-cbfbf797f6b0" />

### NFT Gallery
<img width="1867" height="891" alt="Gallery" src="https://github.com/user-attachments/assets/a35c0b5a-5cea-4e46-b1e8-b26fdf6a7ff5" />

### Marketplace
<img width="1870" height="888" alt="Marketplace" src="https://github.com/user-attachments/assets/782d0e73-f85b-4428-b752-3b99d2f6323f" />

### Activity Feed
<img width="1872" height="908" alt="Activity" src="https://github.com/user-attachments/assets/2ea9acd0-8f5a-49b2-ba86-40ed79a21208" />

### Profile Page
<img width="1872" height="895" alt="Profile" src="https://github.com/user-attachments/assets/67366ba0-c627-471b-802d-54a344557a2e" />

---

## 🪙 Custom Token — SNFT

| Property | Value |
|----------|-------|
| Name | Stellar NFT Token |
| Symbol | SNFT |
| Network | Stellar Testnet |
| Reward per Mint | 10 SNFT |
| Contract Type | Soroban |

---

## 📁 Project Structure

```
stellar-new/
├── .github/workflows/ci.yml       # CI/CD
├── backend/server.js               # IPFS proxy
├── contract/escrow_contract/
│   └── src/lib.rs                  # Escrow Contract (Rust)
├── src/
│   ├── pages/
│   │   ├── DashboardPage.js        # Overview + stats
│   │   ├── EscrowPage.js           # Jobs (Escrow)
│   │   ├── MintPage.js             # NFT minting
│   │   ├── GalleryPage.js          # NFT gallery
│   │   ├── MarketplacePage.js      # Buy/Sell NFTs
│   │   ├── ActivityPage.js         # TX history
│   │   └── PaymentPage.js          # XLM payments
│   ├── components/
│   │   ├── Sidebar.js              # Navigation
│   │   └── ProfilePage.js          # Full profile
│   ├── walletService.js            # Wallet connections
│   └── constants.js                # Contract IDs
└── docs/
    ├── ARCHITECTURE.md             # Architecture document
    └── User_Feedback_Documentation.docx
```

---

## 🔗 Useful Links

- [Stellar Expert Explorer](https://stellar.expert/explorer/testnet)
- [Friendbot — Fund Account](https://friendbot.stellar.org)
- [Soroban Docs](https://soroban.stellar.org)
- [Architecture Document](docs/ARCHITECTURE.md)
- [User Feedback](docs/User_Feedback_Documentation.docx)

---

*Built for Rise In Stellar Quest — Level 5 Blue Belt | March 2026*
