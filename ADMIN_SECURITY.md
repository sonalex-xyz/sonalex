# Admin Dashboard Security & Permissions

This document defines the security model, access control, and authorized actions for the Sonalex admin dashboard.

## ⚠️ Important: Percolator is Permissionless

**Percolator uses a permissionless architecture** where anyone can create slabs/AMMs without governance approval. See [GOVERNANCE_MODEL.md](./GOVERNANCE_MODEL.md) for full details.

- ✅ **Governance controls** protocol-wide safety (margin, oracles, insurance)
- ❌ **Governance does NOT control** individual slab creation (permissionless!)
- ✅ **LPs create slabs** themselves (self-service)
- ✅ **Users choose slabs** to trade on (free market)

## Security Model Overview

Percolator uses a **two-tier authority model** for **protocol-level operations**:

```
┌─────────────────────────────────────────┐
│         Governance Authority            │
│  (Protocol-wide parameters only)        │
└──────────────┬──────────────────────────┘
               │
               ├─ Update global risk parameters
               ├─ Manage oracles
               ├─ Emergency controls
               └─ Registry management

┌─────────────────────────────────────────┐
│      Insurance Authority                │
│  (Limited - insurance fund only)        │
└──────────────┬──────────────────────────┘
               │
               ├─ Top up insurance fund
               ├─ Withdraw insurance surplus
               └─ View insurance stats

┌─────────────────────────────────────────┐
│      Anyone (Permissionless)            │
│  (Slab/AMM creation - no approval)      │
└──────────────┬──────────────────────────┘
               │
               ├─ Create slabs
               ├─ Create AMMs
               ├─ Set slab-specific fees
               └─ Provide liquidity
```

### Authority Accounts

From `registry.rs:14-17`:
```rust
pub struct SlabRegistry {
    pub governance: Pubkey,           // Full admin control
    pub insurance_authority: Pubkey,  // Insurance fund only
    // ...
}
```

**Governance** = Your main admin wallet
**Insurance Authority** = Can be same wallet or separate (for security)

## Admin Dashboard Actions by Permission Level

### 1. **Public (Read-Only) - No Wallet Required**

Anyone can view these metrics:

✅ **Exchange Overview**
- Total Value Locked (TVL)
- 24h Volume
- Total Users
- Open Positions

✅ **Recent Activity Log**
- Recent trades
- Liquidations
- Deposits/Withdrawals

✅ **Oracle Status** (monitoring only)
- Current prices
- Last update times
- Health status

**Implementation:**
```typescript
// No authentication needed
const stats = await client.getExchangeStats();
```

### 2. **Governance Authority - Full Admin Access**

Requires wallet connection + governance authority signature.

#### Risk Parameters (Critical)
✅ **Update Liquidation Parameters**
- Initial Margin Ratio (IMR)
- Maintenance Margin Ratio (MMR)
- Liquidation Band (bps)
- Pre-liquidation Buffer
- Max Oracle Staleness

**Instruction:** Router discriminator `15` (UpdateRiskParams)
**Authority Check:** `registry.governance == signer`

```typescript
// SDK method (to be implemented)
await client.updateRiskParameters(governanceWallet, {
  imr: 500,        // 5%
  mmr: 250,        // 2.5%
  liqBandBps: 200, // 2%
  maxOracleStaleness: 60,
});
```

#### Oracle Management
✅ **Create New Oracles**
- Initialize oracle accounts for new instruments
- Set initial prices

✅ **Update Oracle Prices**
- Manual price updates
- Batch price updates

**Authority Check:** `oracle.authority == signer`

```typescript
await client.updateOraclePrice(adminWallet, oracleAccount, price, confidence);
```

#### Emergency Controls (Extreme Caution)
⚠️ **Pause Trading**
- Halt all trading activity
- Emergency market freeze

⚠️ **Pause Withdrawals**
- Temporarily disable withdrawals
- Prevent bank run during crisis

🔴 **Emergency Shutdown**
- Complete protocol freeze
- Only for critical vulnerabilities

**Instruction:** HaltTrading, ResumeTrading (Slab program)
**Authority Check:** Governance only

```typescript
await client.haltTrading(governanceWallet, slabAccount);
await client.resumeTrading(governanceWallet, slabAccount);
```

#### Fee Configuration (Not Governance Controlled)

**Note:** ❌ Fees are **NOT governance controlled** in the permissionless model. Each slab owner sets their own fees. Governance may set protocol-wide fee caps in the future, but individual slabs set fees within those caps.

See [GOVERNANCE_MODEL.md](./GOVERNANCE_MODEL.md) for details on the permissionless architecture.

### 3. **Insurance Authority - Insurance Fund Only**

Requires wallet connection + insurance authority signature.

✅ **Top Up Insurance Fund**
- Manually add funds to insurance vault
- Strengthen bad debt coverage

**Instruction:** TopUpInsurance (discriminator 12)
**Authority Check:** `registry.insurance_authority == signer`

```typescript
await client.topUpInsurance(insuranceWallet, amount);
```

✅ **Withdraw Insurance Surplus**
- Withdraw excess insurance funds
- Only when `uncovered_bad_debt == 0`

**Instruction:** WithdrawInsurance (discriminator 13)
**Authority Check:** `registry.insurance_authority == signer`
**Safety Check:** `insurance_state.uncovered_bad_debt == 0`

```typescript
await client.withdrawInsurance(insuranceWallet, amount);
```

✅ **View Insurance Metrics**
- Vault balance
- Total payouts
- Daily utilization
- Uncovered bad debt

### 4. **Monitoring (All Admins)**

Both governance and insurance authorities can view:

✅ **Portfolio Health**
- Underwater accounts
- Near-liquidation warnings
- Risk distribution

✅ **Insurance Fund Status**
- Current balance
- Utilization rate
- Bad debt coverage

✅ **System Health**
- Oracle staleness
- Total margin usage
- Open interest

## Access Control Implementation

### Frontend Authentication

```typescript
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const wallet = useWallet();
  const [isGovernance, setIsGovernance] = useState(false);
  const [isInsuranceAuth, setIsInsuranceAuth] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      if (!wallet.publicKey) return;

      // Fetch registry to check authorities
      const registry = await fetchRegistry();

      setIsGovernance(
        wallet.publicKey.equals(registry.governance)
      );

      setIsInsuranceAuth(
        wallet.publicKey.equals(registry.insuranceAuthority)
      );
    }

    checkPermissions();
  }, [wallet.publicKey]);

  return (
    <div>
      {!wallet.connected && (
        <div>Connect wallet to access admin features</div>
      )}

      {wallet.connected && !isGovernance && !isInsuranceAuth && (
        <div>⚠️ Not authorized - governance or insurance authority required</div>
      )}

      {isGovernance && (
        <>
          <RiskParametersPanel />
          <OracleManagement />
          <EmergencyControls />
        </>
      )}

      {isInsuranceAuth && (
        <InsuranceFundManagement />
      )}

      {/* Public monitoring - no auth needed */}
      <ExchangeStats />
      <RecentActivity />
    </div>
  );
}
```

### On-Chain Validation

Every admin action is validated on-chain:

```rust
// Example from risk parameter updates
// SECURITY: Verify governance is signer
if !governance.is_signer() {
    msg!("Error: Governance must be signer");
    return Err(ProgramError::MissingRequiredSignature);
}

// SECURITY: Verify governance authority matches
if &registry.governance != governance_pubkey {
    msg!("Error: Invalid governance authority");
    return Err(ProgramError::InvalidAccountData);
}
```

**Frontend can't bypass this** - even if UI is manipulated, transactions will fail on-chain.

## Security Best Practices

### 1. Multi-Signature (Recommended for Production)

Use Squads/Realms for governance:
```typescript
// Instead of single wallet
const governanceWallet = new Keypair();

// Use multisig
const governanceAuthority = new PublicKey('MULTISIG_PDA');
// Requires 3/5 signatures for admin actions
```

### 2. Separate Insurance Authority

```typescript
// Different wallet for insurance operations
const governance = new PublicKey('GOVERNANCE_WALLET');
const insuranceAuth = new PublicKey('INSURANCE_WALLET');

// Initialize registry with both
await initializeRegistry(governance, insuranceAuth);
```

**Benefits:**
- Limits blast radius if one key compromised
- Can delegate insurance to finance team
- Governance wallet can be cold storage

### 3. Rate Limiting

Implement UI rate limits for sensitive operations:
```typescript
const COOLDOWN_PERIOD = 60_000; // 1 minute

async function updateRiskParams(params) {
  const lastUpdate = getLastUpdateTime('risk_params');
  const timeSince = Date.now() - lastUpdate;

  if (timeSince < COOLDOWN_PERIOD) {
    throw new Error('Too many updates - wait 1 minute');
  }

  // Proceed with update
  await client.updateRiskParameters(wallet, params);
  setLastUpdateTime('risk_params', Date.now());
}
```

### 4. Confirmation Modals

Require double confirmation for dangerous actions:
```typescript
async function emergencyShutdown() {
  const confirmed = await showModal({
    title: '🔴 EMERGENCY SHUTDOWN',
    message: 'This will FREEZE THE ENTIRE PROTOCOL. Are you absolutely sure?',
    requireTyping: 'SHUTDOWN',
    buttons: ['Cancel', 'Confirm Shutdown'],
  });

  if (!confirmed) return;

  // Second confirmation with wallet signature
  await client.emergencyShutdown(governanceWallet);
}
```

### 5. Audit Logging

Log all admin actions:
```typescript
async function updateParameters(params) {
  const action = {
    type: 'UPDATE_RISK_PARAMS',
    authority: wallet.publicKey.toBase58(),
    params,
    timestamp: Date.now(),
  };

  // Log to backend/analytics
  await logAdminAction(action);

  // Execute
  const signature = await client.updateRiskParameters(wallet, params);

  // Log result
  await logAdminAction({
    ...action,
    signature,
    status: 'success',
  });
}
```

## Admin Dashboard UI Sections

### ✅ Public Monitoring (No Auth)
```
📊 Exchange Overview
├─ TVL, Volume, Users, Positions
├─ Recent Activity Log
└─ Oracle Status Monitor

📈 Real-time Charts
├─ Trading volume
├─ Open Interest
└─ Liquidation events
```

### 🔒 Governance Only
```
⚙️ Risk Parameters
├─ Margin ratios
├─ Liquidation bands
└─ Oracle staleness

🏦 Protocol Configuration
└─ Global protocol parameters

🚨 Emergency Controls
├─ Pause trading (future)
├─ Pause withdrawals (future)
└─ Emergency shutdown (future)

🔮 Oracle Management
├─ Create oracles
├─ Update prices
└─ Monitor health
```

### 💰 Insurance Authority Only
```
🛡️ Insurance Fund
├─ Top up vault
├─ Withdraw surplus
└─ View metrics
```

## Action Summary Table

| Action | Governance | Insurance Auth | Public |
|--------|-----------|---------------|--------|
| **View Stats** | ✅ | ✅ | ✅ |
| **View Activity** | ✅ | ✅ | ✅ |
| **Monitor Oracles** | ✅ | ✅ | ✅ |
| **Update Risk Params** | ✅ | ❌ | ❌ |
| **Create Oracle** | ✅ | ❌ | ❌ |
| **Update Oracle Price** | ✅ | ❌ | ❌ |
| **Emergency Controls** | ✅ | ❌ | ❌ |
| **Top Up Insurance** | ❌ | ✅ | ❌ |
| **Withdraw Insurance** | ❌ | ✅ | ❌ |

**Note:** Slab/AMM creation is permissionless and not listed here - anyone can create slabs without governance approval.

## Initial Setup

When deploying Percolator:

```typescript
// Step 1: Generate governance keypair (SAVE SECURELY!)
const governance = Keypair.generate();
console.log('Governance:', governance.publicKey.toBase58());

// Step 2: Generate insurance authority (or use same as governance for testing)
const insuranceAuth = Keypair.generate();
console.log('Insurance Auth:', insuranceAuth.publicKey.toBase58());

// Step 3: Initialize registry with both authorities
await initializeExchange(
  governance.publicKey,
  insuranceAuth.publicKey
);

// Step 4: Update .env with admin wallet
// NEXT_PUBLIC_GOVERNANCE_WALLET=<governance-pubkey>
// NEXT_PUBLIC_INSURANCE_AUTHORITY=<insurance-pubkey>
```

## Future Enhancements

### 1. Role-Based Access Control (RBAC)

Add more granular roles:
- `SUPER_ADMIN` - Full control
- `RISK_MANAGER` - Risk parameters only
- `ORACLE_OPERATOR` - Oracle updates only
- `VIEWER` - Read-only monitoring

### 2. Time-Locked Operations

Critical changes require timelock:
```typescript
// Propose change
await proposeParameterUpdate(params, delay: 24 * 60 * 60); // 24h

// Execute after delay
await executeProposal(proposalId);
```

### 3. Multi-Step Approval

Require multiple signatures for high-risk actions:
```typescript
// 3/5 multisig for emergency shutdown
await requestApproval('emergency_shutdown', requiredSignatures: 3);
```

## Summary

✅ **Governance** = Full admin control (YOU)
✅ **Insurance Authority** = Insurance fund only (YOU or delegate)
✅ **Public** = Read-only monitoring (everyone)

🔒 **All admin actions require wallet signature**
🔒 **On-chain validation prevents unauthorized access**
🔒 **UI authentication is convenience layer only**

The blockchain enforces permissions - the UI just makes it user-friendly.
