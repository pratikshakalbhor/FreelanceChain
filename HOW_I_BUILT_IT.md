# How I Built a Decentralized Freelancing Platform on Stellar Blockchain

*By Pratiksha Vitthal Kalbhor — BSc Blockchain, 2nd Year*

---

## Introduction

The global freelancing market is worth $1.5 trillion, yet platforms like Fiverr charge 20% commission and take 7-14 days for payments. As a blockchain student, I asked myself: **Can we do better with Stellar?**

The answer is FreelanceChain — a trustless freelancing marketplace where clients and freelancers interact directly through smart contracts, with zero platform fees and instant XLM payments.

---

## The Problem with Traditional Freelancing

| Issue | Traditional | FreelanceChain |
|-------|-------------|----------------|
| Platform Fee | 20% (Fiverr) | 0% |
| Payment Speed | 7-14 days | 3-5 seconds |
| Trust | Centralized | Smart Contract |
| Bank Required | Yes | No |
| Fake Reviews | Possible | Blockchain verified |

---

## Why Stellar?

I chose Stellar for three reasons:

1. **Speed** — 3-5 second finality vs Ethereum's minutes
2. **Cost** — $0.00001 per transaction vs Ethereum's gas fees
3. **Soroban** — Rust-based smart contracts that are secure and efficient

---

## Architecture

```
Client (React Frontend)
        ↓
WalletContext (Freighter/Albedo/xBull)
        ↓
Soroban SDK
        ↓
EscrowContract (Rust)
        ↓
Stellar Testnet/Mainnet
```

---

## Smart Contract Design

The core of FreelanceChain is the `EscrowContract` written in Rust:

```rust
pub fn post_job(
    env: Env,
    client: Address,
    title: String,
    description: String,
    amount: i128,
    token_address: Address,
) -> u32 {
    client.require_auth();
    // Lock XLM in contract
    let token = token::Client::new(&env, &token_address);
    token.transfer(&client, &env.current_contract_address(), &amount);
    // Store job...
}
```

Key security features:
- `require_auth()` on every function
- XLM locked atomically on job posting
- Auto-release on approval
- Auto-refund on cancellation

---

## Job Lifecycle

```
1. Client posts job → XLM locked in contract
2. Freelancer applies → Client reviews
3. Client accepts → Job starts
4. Freelancer submits work URL
5. Client approves → XLM released automatically
   OR Client cancels → XLM refunded
```

---

## Advanced Features

### Fee Bump (Gasless Transactions)
Users pay zero XLM in network fees — our platform sponsors all transaction fees using Stellar's Fee Bump mechanism (CAP-0015).

### AI Job Matching
Using Claude API to match freelancer skills with job requirements, showing match percentage on each job card.

### Multi-wallet Support
Freighter, Albedo, and xBull wallets — users choose their preferred wallet.

---

## Challenges & Solutions

**Challenge 1: Freighter detection on localhost**
Solution: Enable HTTPS locally using `HTTPS=true` in `.env`

**Challenge 2: BigInt serialization**
Solution: Custom JSON replacer for sessionStorage

**Challenge 3: Firebase offline**
Solution: Enable `persistentLocalCache` with `FirestoreSettings`

---

## Results

- ✅ 30+ users onboarded on testnet
- ✅ 127+ commits
- ✅ 2 smart contract tests passing
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Live on Vercel

---

## What's Next

1. Stellar Mainnet deployment
2. SEP-24 anchor integration (on/off ramp)
3. Rating & Review system (blockchain verified)
4. Mobile app (React Native)
5. 10,000+ users target

---

## Conclusion

Building FreelanceChain taught me that blockchain isn't just about cryptocurrencies — it's about building trustless systems that give power back to users. Stellar's speed and low cost make it perfect for real-world applications like freelancing.

If you're a developer looking to build on Stellar, start with Soroban — the documentation is excellent and the community is incredibly supportive.

**Try FreelanceChain:** [freelancechain-dapp.vercel.app](https://freelancechain-dapp.vercel.app)
**GitHub:** [github.com/pratikshakalbhor/FreelanceChain](https://github.com/pratikshakalbhor/FreelanceChain)

---

*Published as part of Stellar Journey to Mastery — Level 6 Ecosystem Contribution*
*#stellarjourneytomastery @buildonstellar @StellarOrg*
