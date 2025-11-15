# Squads Multisig Setup Guide

This guide explains how to set up and use Squads Protocol multisig for Percolator governance.

## Why Use Multisig?

**Single Key Governance** ❌
```
CEO has governance key
→ If CEO's laptop is compromised, entire protocol is at risk
→ No accountability for who made changes
→ Single point of failure
```

**Multisig Governance** ✅
```
Multisig requires 3 of 5 signatures:
- CEO wallet
- CTO wallet
- CFO wallet
- Risk Manager wallet
- Security Lead wallet

→ No single point of failure
→ On-chain audit trail
→ Team consensus on critical decisions
```

## How It Works

### The Magic

Your Percolator smart contracts **don't need to change at all**! They just check:

```rust
// Percolator code - unchanged
if signer.key != &registry.governance {
    return Err(ProgramError::InvalidAccountData);
}
```

Whether `registry.governance` is:
- A single wallet address, OR
- A Squads multisig address

...the code works exactly the same! 🎉

### The Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Sonalex detects governance is a multisig         │
│    (automatically via isSquadsMultisig check)       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. User clicks "Update Risk Parameters"             │
│    → Instead of sending transaction directly...     │
│    → Shows instructions to create Squads proposal   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. User goes to https://v4.squads.so/               │
│    → Creates proposal with serialized transaction   │
│    → Adds memo describing the change                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Team members approve in Squads UI                │
│    CEO approves ✅ (1/3)                             │
│    CTO approves ✅ (2/3)                             │
│    CFO approves ✅ (3/3 - threshold met!)           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. Squads executes transaction automatically        │
│    → Signer = Multisig PDA                          │
│    → Percolator validates: signer == governance ✅  │
│    → Parameters updated!                            │
└─────────────────────────────────────────────────────┘
```

## Setup Instructions

### Phase 1: Development (Current)

Use single wallet for testing:

```bash
# .env.local
NEXT_PUBLIC_GOVERNANCE_WALLET=YourDevWallet...
NEXT_PUBLIC_INSURANCE_AUTHORITY=YourDevWallet...
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

Everything works as normal - single wallet signs transactions directly.

### Phase 2: Create Squads Multisig

#### Step 1: Go to Squads UI

1. Visit https://v4.squads.so/
2. Connect your wallet (any team member can create it)
3. Click "Create Squad"

#### Step 2: Configure Multisig

```
Squad Name: Percolator Governance
Description: Governance authority for Percolator protocol

Members:
- CEO Wallet: BzR3...abc (you)
- CTO Wallet: 7Ks...def
- CFO Wallet: 9Mx...ghi
- Risk Manager: 2Pq...jkl
- Security Lead: 5Yz...mno

Threshold: 3 of 5 signatures required

Create Authority: YES (allows adding/removing members later)
```

#### Step 3: Get Multisig Address

After creation, you'll get a multisig address like:
```
Squad Address: GovMultisig...xyz
```

Copy this address!

### Phase 3: Transfer Governance to Multisig

#### Option A: New Deployment

When initializing Percolator registry, use the multisig address:

```typescript
import { initializeRegistry } from './sdk';

await initializeRegistry(
  connection,
  payer,
  new PublicKey('GovMultisig...xyz'),  // ← Squads multisig address
  new PublicKey('InsuranceAuth...abc')
);
```

#### Option B: Transfer Existing Governance

If you already deployed with a single wallet, transfer authority:

```typescript
// This requires CURRENT governance to sign
await transferGovernance(
  connection,
  currentGovernanceKeypair,  // Your current dev wallet
  new PublicKey('GovMultisig...xyz')  // New multisig address
);
```

**⚠️ WARNING:** After this transaction, your single wallet **cannot** make governance changes anymore! Only the multisig can.

### Phase 4: Update Environment Variables

```bash
# .env.local (or .env.production)
NEXT_PUBLIC_GOVERNANCE_WALLET=GovMultisig...xyz  # ← Multisig address
NEXT_PUBLIC_INSURANCE_AUTHORITY=InsuranceAuth...abc
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

### Phase 5: Test It!

1. Connect to Sonalex admin dashboard with any team member wallet
2. You should see "👑 Governance" badge (because you're a multisig member!)
3. Try clicking "Update Risk Parameters"
4. You'll see instructions to create a Squads proposal
5. Follow the instructions in Squads UI
6. Get other team members to approve
7. Transaction executes automatically when threshold is met! 🎉

## Daily Operations

### Scenario: Update Risk Parameters

**Risk Manager** (authenticated as multisig member):

1. Goes to Sonalex admin dashboard
2. Sees current parameters:
   - IMR: 5%
   - MMR: 2.5%
3. Clicks "Update Parameters"
4. Sonalex shows: "Multisig approval required"
5. Copies serialized transaction
6. Goes to https://v4.squads.so/
7. Creates proposal: "Increase IMR to 7% due to market volatility"
8. Shares proposal link with team

**CEO** (checks Squads):
- Reviews proposal
- Approves ✅ (1/3)

**CTO** (checks Squads):
- Reviews code/parameters
- Approves ✅ (2/3)

**CFO** (checks Squads):
- Reviews financial impact
- Approves ✅ (3/3 - **THRESHOLD MET!**)

**Squads automatically executes** → Parameters updated on-chain! ✅

### Scenario: Emergency Action

If you need faster execution, adjust threshold temporarily:

```
Normal operations: 3 of 5
Emergency: 2 of 5

Members vote to reduce threshold:
→ Create proposal: "Reduce threshold to 2/5 for emergency"
→ Get 3 approvals (using current 3/5 threshold)
→ Execute
→ Now only 2 signatures needed for urgent actions
```

(Remember to vote it back up to 3/5 after emergency!)

## Code Integration

### Automatic Multisig Detection

Sonalex automatically detects if governance is a multisig:

```typescript
// lib/multisig.ts
export async function hasGovernancePermission(
  connection: Connection,
  governanceAddress: PublicKey,
  walletAddress: PublicKey
): Promise<boolean> {
  // Check 1: Direct match (single wallet)
  if (walletAddress.equals(governanceAddress)) {
    return true;
  }

  // Check 2: Multisig member
  const isMultisig = await isSquadsMultisig(connection, governanceAddress);
  if (isMultisig) {
    return await isMultisigMember(connection, governanceAddress, walletAddress);
  }

  return false;
}
```

### Permission Guard

Already updated to support multisig:

```typescript
// app/admin/components/PermissionGuard.tsx
<PermissionGuard requiredPermission={Permission.GOVERNANCE}>
  {/* This shows if user's wallet is either:
      1. The governance wallet (single wallet mode), OR
      2. A member of the governance multisig (multisig mode)
  */}
  <button onClick={updateParams}>Update Parameters</button>
</PermissionGuard>
```

### Smart Button Component

Use `MultisigProposalButton` for governance actions:

```typescript
import { MultisigProposalButton } from '@/app/admin/components/MultisigProposalButton';

<MultisigProposalButton
  governanceAddress={process.env.NEXT_PUBLIC_GOVERNANCE_WALLET!}
  buildTransaction={async () => {
    // Build your transaction here
    return createUpdateRiskParamsTransaction(...);
  }}
  actionName="Update Risk Parameters"
  actionDescription="Increase IMR from 5% to 7%"
  danger={false}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg"
>
  Update Parameters
</MultisigProposalButton>
```

This component:
- ✅ Detects if governance is single wallet or multisig
- ✅ Single wallet → Shows confirmation modal → Executes directly
- ✅ Multisig → Shows Squads instructions → User creates proposal

## Security Benefits

### Accountability

Every action has an on-chain audit trail:

```
Proposal #42: "Update IMR to 7%"
Created by: Risk Manager (2Pq...jkl) at 2025-01-15 10:30 UTC
Approved by:
  - CEO (BzR3...abc) at 2025-01-15 11:00 UTC
  - CTO (7Ks...def) at 2025-01-15 11:15 UTC
  - CFO (9Mx...ghi) at 2025-01-15 12:00 UTC
Executed: 2025-01-15 12:00 UTC
Transaction: abc123...xyz
```

### No Single Point of Failure

If one team member:
- Loses their wallet → Others can still operate
- Goes rogue → Can't execute alone (needs threshold)
- Gets compromised → Attacker needs multiple wallets

### Time to React

Proposals aren't instant:
- Team has time to review
- Can discuss before approving
- Can reject malicious proposals

## Advanced: Hybrid Model

You can use different authorities for different actions:

```typescript
// registry.rs
pub struct SlabRegistry {
    pub governance: Pubkey,          // Multisig (3/5) - critical actions
    pub risk_manager: Pubkey,        // Single wallet - daily risk updates
    pub oracle_operator: Pubkey,     // Single wallet - price feeds
    pub insurance_authority: Pubkey, // Single wallet OR another multisig
}
```

**When to use what:**

| Action | Authority | Why |
|--------|-----------|-----|
| Emergency shutdown | Governance multisig (3/5) | Critical, needs consensus |
| Update IMR/MMR | Risk manager (single) | Daily operations, needs speed |
| Update oracle prices | Oracle operator (single) | High frequency, routine |
| Insurance withdrawal | Insurance multisig (2/3) | Financial, needs approval |

This gives you the best of both worlds:
- Critical actions → Require multisig approval
- Routine actions → Fast single-wallet execution

## FAQ

### Q: Do I need to modify Percolator Rust code?

**A: No!** Percolator just checks `if signer == governance`. It doesn't know or care if governance is a wallet or multisig.

### Q: Do I need to modify Sonalex significantly?

**A: Minimal changes!** Just the permission checking logic. The rest is automatic detection.

### Q: What if a team member leaves?

Go to Squads UI → Manage Members → Remove member or change threshold. This requires a proposal approved by current threshold.

### Q: What if we lose threshold number of wallets?

⚠️ **Protocol is locked!** This is why you should:
- Use threshold wisely (3/5, not 5/5)
- Keep backup recovery plan
- Consider upgrade authority separate from governance

### Q: Can we use Squads for insurance authority too?

**Yes!** Just create a second multisig for insurance:

```bash
NEXT_PUBLIC_GOVERNANCE_WALLET=GovMultisig...xyz     # 3/5: Strategic decisions
NEXT_PUBLIC_INSURANCE_AUTHORITY=InsMultisig...abc   # 2/3: Financial decisions
```

### Q: Does this work on devnet?

**Yes!** Squads works on devnet, testnet, and mainnet. Test it on devnet first!

### Q: How much does Squads cost?

- Creating multisig: ~0.01 SOL (rent)
- Creating proposals: ~0.001 SOL per proposal
- Approving: Just transaction fees

Very affordable compared to security benefits!

## Migration Checklist

- [ ] **Development**: Use single wallet, test all features
- [ ] **Pre-Mainnet**: Create Squads multisig, add all team members
- [ ] **Testnet**: Transfer governance to multisig, test proposal flow
- [ ] **Mainnet**: Deploy with multisig as governance from day 1
- [ ] **Document**: Share Squads access with all team members
- [ ] **Test**: Create a test proposal and get team to approve
- [ ] **Backup**: Document recovery plan if wallets are lost

## Resources

- Squads V4: https://v4.squads.so/
- Squads Docs: https://docs.squads.so/
- Squads SDK: https://github.com/Squads-Protocol/v4
- Support: https://discord.gg/squads

---

**Remember**: The blockchain enforces permissions, not your UI. Even with multisig, on-chain validation is what matters. The UI just makes the UX better! 🔐
