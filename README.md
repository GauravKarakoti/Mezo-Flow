# Mezo Flow

**Cross-Chain Yield Aggregator for MUSD and MEZO**

Your Bitcoin-backed capital, working harder across every chain.

---

## Overview

Mezo Flow is a cross-chain yield aggregation protocol for MUSD and MEZO. Deposit once on any supported chain, and the protocol automatically deploys your capital into the highest-yielding opportunities across Mezo, Ethereum, Base, and BNB Chain. No manual bridging, no position monitoring, no compounding headaches.

Built for the Mezo Buildathon (Track 1: DeFi).

---

## The Problem

MUSD and MEZO are powerful assets, but their yield opportunities are fragmented:

- **MUSD Savings Vault** on Mezo offers native yield, but only on Mezo.
- **Curve and Uniswap pools** on Ethereum offer MUSD liquidity, but require bridging and manual management.
- **Aerodrome on Base** has deep MUSD liquidity, but accessing it means navigating a new chain.
- **Lending markets** on BNB Chain accept stablecoins, but MUSD isn't natively supported there yet.

Users who want to earn yield on their Bitcoin-backed capital must manually bridge, swap, deposit, monitor, claim, and compound across four chains. Most don't bother.

**Mezo Flow solves this.**

---

## How It Works

1. **Deposit** MUSD or MEZO on any supported chain.
2. **Router** evaluates live yield opportunities across whitelisted venues.
3. **Cross-chain deployment** via Wormhole NTT moves capital natively to the best venue.
4. **Auto-compounding** harvests and reinvests yield at configurable intervals.
5. **Withdraw** anytime—receive principal plus yield, bridged back to your preferred chain.

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
```bash
npx hardhat run scripts/deploy.js --network mezoTestnet
```
### Deploy to Base Testnet
```bash
npx hardhat run scripts/deploy.js --network baseTestnet
```

## Contract Addresses (Mezo Testnet)
| Contract | Address |
|----------|---------|
| MezoFlowVault |	0x... (deployed) |
| YieldRouter |	0x... (deployed) |
| MUSD Token | 0x1189...Ac503 |
| MEZO Token | 0x... |

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
- [x] Wormhole NTT integration
- [x] Mezo Testnet deployment
- [ ] Base Testnet deployment
- [ ] Ethereum and BNB Chain support
- [ ] MEZO staking derivative integration
- [ ] Governance and veMEZO voting
- [ ] Institutional vaults

## Links
- Live Demo: 
- GitHub: https://github.com/GauravKarakoti/mezo-flow
- Mezo Docs: https://mezo.org/docs
- Discord: https://discord.mezo.org

Built for the Mezo Buildathon - Bank on yourself. Build on Bitcoin.
