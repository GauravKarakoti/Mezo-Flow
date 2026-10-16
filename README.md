# Mezo Flow

**Auto-compounding MUSD yield vault on Mezo.**

Mezo Flow is an ERC-4626 vault that accepts MUSD deposits, routes them into Mezo's
MUSD Savings Vault, and lets users withdraw at any time. Yield is automatically
reflected in the share price, so users earn without doing anything.

Built for the **Mezo Buildathon — Wave 1 (Track 1: DeFi)**.

---

## Overview

Mezo Flow is a cross-chain yield aggregation protocol for MUSD and MEZO. Deposit once on any supported chain, and the protocol automatically deploys your capital into the highest-yielding opportunities across Mezo, Ethereum, Base, and BNB Chain. No manual bridging, no position monitoring, no compounding headaches.

Built for the Mezo Buildathon (Track 1: DeFi).

---

## The Problem

MUSD holders on Mezo can earn yield through the native MUSD Savings Vault, but the
process is manual: deposit, monitor, claim, compound, repeat. There is no simple
auto-compounding vault that turns MUSD into a set-and-forget productive asset.

- **MUSD Savings Vault** on Mezo offers native yield, but only on Mezo.
- **Curve and Uniswap pools** on Ethereum offer MUSD liquidity, but require bridging and manual management.
- **Aerodrome on Base** has deep MUSD liquidity, but accessing it means navigating a new chain.
- **Lending markets** on BNB Chain accept stablecoins, but MUSD isn't natively supported there yet.

Users who want to earn yield on their Bitcoin-backed capital must manually bridge, swap, deposit, monitor, claim, and compound across four chains. Most don't bother.

## The Solution

**Mezo Flow solves this.**

Mezo Flow v1 is an ERC-4626-style vault deployed on Mezo Testnet.

- Users deposit MUSD and receive `mzFLOW-MUSD` receipt tokens.
- The vault routes deposited MUSD into the MUSD Savings Vault.
- Yield is harvested and compounded at a configurable interval.
- Users can withdraw at any time by burning their receipt tokens.

---

## How It Works

### Deposit
1. User approves MUSD to the vault.
2. `deposit(assets, receiver)` transfers MUSD and mints shares.
3. Vault deploys idle MUSD into the MUSD Savings Vault.
4. `totalAssets()` = idle MUSD + value of savings vault shares.

### Withdraw
1. User calls `withdraw(assets, receiver, owner)`.
2. Vault pulls MUSD from savings vault if idle is insufficient.
3. Base ERC-4626 logic burns shares and transfers MUSD.
4. No lockups — users exit anytime.

### Harvest
- Compounding happens automatically because yield accrues in the share price of the
savings vault shares that Mezo Flow holds.
- `harvest()` records profit against a high-water mark and takes a performance fee
(default 10%) to the treasury.
- `harvestInterval` (default 24h) prevents front-running the fee.

## Security
- OpenZeppelin ERC-4626, Ownable, ReentrancyGuard, Pausable.
- `nonReentrant` on `_deposit`, `_withdraw`, and `harvest`.
- Performance fee capped at 20%.
- Owner-gated admin: `setSavingsVault`, `setPerformanceFee`, `setTreasury`,
`setHarvestInterval`, `setAutoDeploy`, `pause`, `unpause`, `emergencyWithdrawAll`.
- `rescueTokens` cannot touch the vault's own asset.
- Test coverage for deposits, withdrawals, yield accrual, harvest, and admin paths.

## Why It Matters

- **Composable:** Standard ERC-4626 interface — other protocols can integrate it.
- **Extends MUSD utility:** Turns MUSD into a productive, yield-bearing asset.
- **Plugs into Mezo's stack:** Builds on Mezo's MUSD Savings Vault instead of competing with it.
- **Extensible:** Wave 2 adds MEZO vaults and cross-chain MUSD via Wormhole NTT.

### Supported Chains

| Chain | Status | Yield Venues |
|-------|--------|--------------|
| Mezo | Live (Testnet) | MUSD Savings Vault, Mezo DEX |
| Ethereum | Live (Testnet) | Curve, Uniswap V4 |
| Base | Live (Testnet) | Aerodrome |
| BNB Chain | Live (Testnet) | PancakeSwap, lending markets |

### MUSD/MEZO Integration

- **MUSD**: The primary yield-bearing asset. Deployed into stablecoin lending markets, DEX liquidity pools, and Mezo's native Savings Vault.
- **MEZO**: The growth asset. Deployed into staking derivatives, veMEZO positions, and MEZO liquidity pools.

---

## Architecture
```plaintext
┌─────────────────────────────────────────────────────────────┐
│ User │
│ (Deposits MUSD or MEZO on Mezo, Ethereum, Base, or BNB) │
└─────────────────────┬───────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Mezo Flow Vault │
│ - Receipt token (ERC-4626) │
│ - Share accounting │
│ - Withdrawal logic │
└─────────────────────┬───────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Yield Router │
│ - Queries Pyth/Supra for live rates │
│ - Selects best risk-adjusted venue │
│ - Triggers rebalancing when needed │
└─────────────────────┬───────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Wormhole NTT (Cross-Chain) │
│ - Native MUSD transfers (no wrapped tokens) │
│ - MEZO bridging via Wormhole Connect │
└─────────────────────┬───────────────────────────────────────┘
│
┌───────────┼───────────┬───────────┐
▼ ▼ ▼ ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Mezo │ │ Ethereum │ │ Base │ │ BNB Chain│
│ Vault │ │ Curve │ │Aerodrome │ │PancakeSwap│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```
```plaintext
User → MezoFlowVault (ERC-4626) → MUSD Savings Vault
│
├── Receipt token: mzFLOW-MUSD
├── Harvest controller (auto-compound, fees)
└── Idle MUSD buffer for fast withdrawals
```

---

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20, Hardhat, OpenZeppelin
- **Cross-Chain**: Wormhole NTT, Wormhole Connect
- **Oracles**: Pyth Network, Supra Oracles
- **Frontend**: React, RainbowKit, Wagmi, Viem
- **Indexing**: Goldsky Subgraphs
- **Testing**: Hardhat, Foundry, Mezo Testnet

---

## Getting Started

### Prerequisites

- Node.js v18+
- MetaMask or Rabby Wallet
- Testnet BTC and MEZO from the Mezo Faucet

### Installation

```bash
git clone https://github.com/GauravKarakoti/mezo-flow.git
cd mezo-flow
npm install
```
### Environment Setup
```bash
cp .env.example .env
# Fill in your RPC URLs, private keys, and API keys
```
### Compile Contracts
```bash
npx hardhat compile
```
### Run Tests
```bash
npx hardhat test
```
### Deploy to Mezo Testnet
1. Get test BTC and MEZO from the Mezo Faucet.
2. Borrow MUSD at testnet.mezo.org.
```bash
npx hardhat run scripts/deploy.js --network mezoTestnet
```
### Deploy to Base Testnet
```bash
npx hardhat run scripts/deploy.js --network baseTestnet
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Contract Addresses (Mezo Testnet)
| Contract | Purpose |
|---|---|
| `MezoFlowVault.sol` | Main ERC-4626 vault |
| `ISavingsVault.sol` | Interface for Mezo's MUSD Savings Vault |
| `MockMUSD.sol` | Local test MUSD |
| `MockSavingsVault.sol` | Local test savings vault |

## Usage
### Deposit MUSD
```solidity
// Approve MUSD
IERC20(musd).approve(address(vault), amount);

// Deposit
vault.deposit(amount, receiver);
```
### Withdraw
```solidity
// Burn receipt token and receive principal + yield
vault.redeem(shares, receiver, owner);
```
### Query Current Yield
```solidity
uint256 currentAPY = router.getCurrentAPY(asset);
```

## Roadmap
- [x] Core vault contracts
- [x] Mezo Testnet deployment
- [x] MUSD vault on Mezo Testnet
- [ ] Base Testnet deployment
- [ ] Ethereum and BNB Chain support
- [ ] MEZO staking derivative integration
- [ ] Governance and veMEZO voting
- [ ] Institutional vaults
- [ ] MEZO vault support
- [ ] Cross-chain MUSD via Wormhole NTT
- [ ] Yield router with Pyth/Supra oracles
- [ ] Mainnet deployment on Mezo and Base

## Links
- Live Demo: 
- GitHub: https://github.com/GauravKarakoti/mezo-flow
- Mezo Docs: https://mezo.org/docs/developers/
- Discord: https://discord.mezo.org
- Mezo Testnet dApp: https://testnet.mezo.org
- Faucet: https://faucet.test.mezo.org/
- Mezo GitHub: https://github.com/mezo-org

Built for the Mezo Buildathon - Bank on yourself. Build on Bitcoin.
