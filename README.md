# 🔗 GrantChain — Transparent Fund Tracking on Algorand

**GrantChain** is a milestone-based grant management platform built on the Algorand blockchain. It provides transparent, verifiable, and role-based fund tracking for grants — from creation to completion.

> Built for the **Algorand No-TEAL Hackathon** — leveraging native Algorand features (Multisig, Transaction Notes) without custom smart contracts.

🌐 **Live Demo**: [lakshman-reddy-sudo.github.io/grant-tracker](https://lakshman-reddy-sudo.github.io/grant-tracker/)

---

## 🎯 What It Does

GrantChain solves the transparency problem in grant management:

- **Sponsors** create and fund grants with milestone-based payouts
- **Admin (DAO)** reviews and approves/rejects submitted milestones
- **Teams** submit work for each milestone and track expenses
- **Public** can view all grants and their progress transparently

Every transaction, vote, and expense is recorded with a unique transaction ID, creating a complete audit trail.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    GrantChain App                      │
├──────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                              │
│  ├── Landing Page       — Public intro                │
│  ├── Login              — Role-based auth             │
│  ├── Dashboard          — All grants overview          │
│  ├── Create Grant       — Multi-milestone setup        │
│  ├── Grant Detail       — Full workflow & actions       │
│  ├── Analytics          — Charts & insights             │
│  └── Public View        — Transparency page             │
├──────────────────────────────────────────────────────┤
│  Algorand Integration (algosdk v3)                    │
│  ├── Pera Wallet Connect — Wallet linking              │
│  ├── Multisig Escrow     — Shared custody addresses    │
│  ├── Transaction Notes   — On-chain metadata           │
│  └── Balance Queries     — Real-time wallet balances    │
├──────────────────────────────────────────────────────┤
│  State Management                                     │
│  └── localStorage        — Grants, milestones, txns    │
└──────────────────────────────────────────────────────┘
```

---

## 👤 Roles & Permissions

| Action | Sponsor | Admin | Team |
|---|:---:|:---:|:---:|
| Create Grant | ✅ | ✅ | ❌ |
| Fund Grant | ✅ | ❌ | ❌ |
| Approve/Reject Milestone | ❌ | ✅ | ❌ |
| Submit Milestone Work | ❌ | ❌ | ✅ |
| Release Milestone Funds | ✅ | ❌ | ❌ |
| Log Expenses | ❌ | ❌ | ✅ |
| Cast DAO Votes | ✅ | ✅ | ❌ |
| View Public Dashboard | ✅ | ✅ | ✅ |

---

## 🔄 Grant Lifecycle Workflow

```
1. CREATE  →  Sponsor/Admin creates grant with milestones
                 ↓
2. FUND    →  Sponsor funds the grant (recorded with Txn ID)
                 ↓
3. SUBMIT  →  Team submits work for a milestone
                 ↓
4. REVIEW  →  Admin approves ✅ or rejects ❌ the submission
                 ↓ (if approved)          ↓ (if rejected)
5. RELEASE →  Sponsor releases      Team resubmits
               milestone funds         their work
                 ↓
6. FUNDED  →  Milestone marked as funded with Txn ID
```

### Milestone Status Flow

```
pending → submitted → approved → funded
                   ↘ rejected → pending (resubmit)
```

---

## ⚙️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **algosdk v3** | Algorand SDK for wallet, transactions, multisig |
| **@perawallet/connect v1.5** | Pera Wallet integration |
| **react-router-dom v7** | Client-side routing (HashRouter for GitHub Pages) |
| **localStorage** | Persistent state management |
| **Algorand TestNet** | Blockchain network (Algonode public endpoints) |

---

## 📁 Project Structure

```
grant-tracker/
├── src/
│   ├── App.jsx              # Main app, routing, navbar, wallet connection
│   ├── main.jsx             # Entry point
│   ├── index.css            # Full design system (dark theme, glassmorphism)
│   ├── pages/
│   │   ├── Landing.jsx      # Public landing page with features
│   │   ├── Login.jsx        # Role-based login (Sponsor/Admin/Team)
│   │   ├── Dashboard.jsx    # Grant cards, stats, filtering
│   │   ├── CreateGrant.jsx  # Multi-step grant creation form
│   │   ├── GrantDetail.jsx  # Full grant view with milestones & actions
│   │   ├── Analytics.jsx    # Visual analytics dashboard
│   │   └── PublicView.jsx   # Public transparency view
│   └── utils/
│       ├── algorand.js      # Algorand SDK: wallet balance, txns, multisig
│       ├── store.js         # localStorage CRUD: grants, auth, transactions
│       └── wallet.js        # Pera Wallet connect/disconnect/reconnect
├── index.html               # SPA entry
├── vite.config.js           # Vite config with /grant-tracker/ base path
└── package.json             # Dependencies
```

---

## 🔑 Key Features Explained

### 1. Multisig Escrow Addresses
When a grant is created, a **Multisig address** is generated from the sponsor, admin, and team wallet addresses using Algorand's native multisig feature. This creates a shared-custody escrow — no custom smart contract needed.

```javascript
// algorand.js — createMultisigAddress()
algosdk.multisigAddress({
    version: 1,
    threshold: 2,  // 2-of-3 approval needed
    addrs: [sponsorAddr, adminAddr, teamAddr]
});
```

### 2. Pera Wallet Integration
Users can connect their **Pera Wallet** (Algorand's primary mobile wallet) to the app. The connected wallet address is displayed in the navbar and associated with the user's role. Real-time balance is fetched from Algorand TestNet.

```javascript
// wallet.js
const peraWallet = new PeraWalletConnect({
    network: 'testnet',
    chainId: 416002,
});
```

### 3. Transaction Notes as Metadata
Every funding and milestone release generates a transaction with a descriptive note embedded in the Algorand transaction, creating a permanent on-chain audit trail.

```
GRANTCHAIN FUND: Research Grant | Amount: 5 ALGO
GRANTCHAIN MILESTONE: Phase 1 Complete | Grant: Research Grant
```

### 4. Role-Based Access Control
The login system assigns roles (Sponsor, Admin, Team) which determine what actions are available. Each role sees different buttons and capabilities on the Grant Detail page.

### 5. Real-Time Analytics
The Analytics page shows:
- Total grants, funding, and expenses
- Status distribution (draft, active, completed)
- Role-based activity breakdown
- Top funded grants

### 6. Public Transparency Page
Anyone can visit the Public page to view all grant details, milestone progress, and transaction history — ensuring full transparency without needing to log in.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **yarn**
- **Pera Wallet** app (optional, for wallet linking)

### Installation

```bash
# Clone the repository
git clone https://github.com/lakshman-reddy-sudo/lakshman-reddy-sudo.github.io.git
cd lakshman-reddy-sudo.github.io/grant-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173/grant-tracker/`

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run build
# Copy dist/ contents to your GitHub Pages repo
```

---

## 🧪 How to Test the Full Workflow

1. **Login as Sponsor** → Enter name → Select "Sponsor" → Login
2. **Connect Pera Wallet** → Click wallet button → Scan QR with Pera app
3. **Create Grant** → Fill in name, description, add milestones → Submit
4. **Fund the Grant** → Click "💰 Fund Grant" → Enter amount → Send ALGO
5. **Logout → Login as Team** → Go to the grant → Click "📤 Submit Work" on a milestone
6. **Logout → Login as Admin** → Go to the grant → Click "✅ Approve" or "❌ Reject"
7. **Logout → Login as Sponsor** → Go to the grant → Click "💸 Release ALGO" on approved milestones
8. **Check Public View** → Click "Public" in navbar → See all grants transparently

---

## 🌐 Algorand TestNet Configuration

The app connects to Algorand TestNet using free public endpoints:

| Service | Endpoint |
|---|---|
| Algod API | `https://testnet-api.algonode.cloud` |
| Indexer API | `https://testnet-idx.algonode.cloud` |
| Explorer | `https://testnet.explorer.perawallet.app` |
| Lora Explorer | `https://lora.algokit.io/testnet` |

No API keys required — these are public Algonode endpoints.

---

## 📊 What Makes This Work Without Smart Contracts

GrantChain demonstrates that you can build a fully functional grant management system using **only native Algorand features**:

| Feature | Algorand Native Feature Used |
|---|---|
| Escrow / Custody | **Multisig Accounts** (2-of-3 threshold) |
| Audit Trail | **Transaction Notes** (embedded metadata) |
| Identity | **Wallet Addresses** (Pera Wallet) |
| Fund Tracking | **Payment Transactions** (ALGO transfers) |
| Verification | **Block Explorer** links (Lora / AlgoExplorer) |

No TEAL, no ABI, no smart contract compilation — just native blockchain primitives.

---

## 🎨 Design System

The app uses a custom dark theme with glassmorphism:
- **Color Palette**: Deep purple/blue gradients with vibrant accents
- **Typography**: Inter font family (Google Fonts)
- **Components**: Glass-effect cards, animated badges, responsive grid
- **Animations**: Fade-in transitions, hover effects, gradient text

---

## 📄 License

This project is built for the **Algorand No-TEAL Hackathon**.

---

## 👨‍💻 Team

Built by **Lakshman Reddy** — [GitHub](https://github.com/lakshman-reddy-sudo)
