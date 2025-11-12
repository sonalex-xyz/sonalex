# Percolator Governance Model - Permissionless Architecture

## Critical Discovery: Percolator is Permissionless!

After reviewing the Percolator codebase, it has evolved to a **permissionless architecture** where:

✅ **Anyone can create slabs/AMMs** - No governance approval needed
✅ **Users choose which matchers to use** - Free market selection
✅ **LPs self-service liquidity provision** - Direct slab creation

From `registry.rs:5-9`:
> "Protocol registry account (formerly SlabRegistry, **now whitelist-free**)
> Stores global protocol parameters and state. **Users permissionlessly choose
> which matchers to interact with - no whitelist needed.**"

## What Changed

### ❌ Old Model (Removed)
```rust
// RouterInstruction::RegisterSlab - REMOVED (permissionless matchers)
// - Governance had to approve each slab
// - Whitelist of approved matchers
// - Centralized control
```

### ✅ New Model (Current)
```rust
// Slabs are permissionless - no whitelist required
// - Anyone can deploy a slab
// - Users choose which slabs to trade on
// - Free market competition
```

From `entrypoint.rs:40`:
```rust
// 9 => RegisterSlab - REMOVED (permissionless matchers)
```

From `exchange.rs:201, 264`:
```rust
println!("Slabs are permissionless - no whitelist required");
```

## Governance Responsibilities - Revised

### What Governance DOES Control

#### 1. **Global Risk Parameters** (Protocol-wide)
These affect the entire exchange, so governance sets them:

✅ **Margin Requirements**
- Initial Margin Ratio (IMR) - default 5%
- Maintenance Margin Ratio (MMR) - default 2.5%
- Applied to ALL positions across ALL slabs

✅ **Liquidation Parameters**
- Liquidation Band (bps) - default 200 bps (2%)
- Pre-liquidation Buffer
- Applied uniformly across protocol

✅ **Oracle Configuration**
- Max Oracle Staleness (default 60 seconds)
- Oracle Tolerance (bps)
- Critical for preventing stale price trades

✅ **Insurance Fund**
- Insurance parameters
- PnL vesting parameters
- Adaptive warmup configuration
- Global haircut (crisis management)

✅ **Protocol Settings**
- Router cap per slab
- Minimum equity to quote
- System-wide safety parameters

#### 2. **Registry Management**
- Initialize the registry (one-time)
- Update governance authority
- Update insurance authority
- Modify global parameters

#### 3. **Emergency Controls** (Protocol-wide)
⚠️ These affect the entire protocol:
- Global haircut trigger (crisis)
- Parameter updates in emergency
- Insurance fund management

### What Governance DOES NOT Control

❌ **Individual Slab Registration** - PERMISSIONLESS
- Anyone can deploy a slab
- No governance approval needed
- Users choose which slabs to use

❌ **Individual AMM Creation** - PERMISSIONLESS
- Anyone can create an AMM pool
- No centralized whitelist
- Free market for liquidity

❌ **LP Operations** - USER CONTROLLED
- LPs choose which slabs/AMMs to provide liquidity to
- LPs set their own price ranges
- LPs manage their own positions

❌ **Fee Setting (Slab-specific)** - SLAB OWNER DECIDES
- Each slab sets its own fees
- Governance may set MAX fee caps
- But individual slabs choose within limits

## LP Self-Service Model

### How LPs Operate (Permissionless)

#### Step 1: Create Slab (No Governance Needed!)

```typescript
// LP creates their own slab
async function createMySlab(lpOwner: Keypair, instrument: string) {
  // 1. Generate slab account keypair
  const slabKeypair = Keypair.generate();

  // 2. Deploy slab program (or use existing deployment)
  // Slab programs are stateless - multiple slabs can use same program

  // 3. Initialize slab
  const createSlabIx = await createInitializeSlabInstruction(
    slabKeypair.publicKey,
    lpOwner.publicKey,    // LP is the owner!
    instrumentPubkey,
    oraclePubkey,
    makerFee,             // LP sets fees
    takerFee,
    routerProgramId
  );

  // 4. Send transaction
  await sendTransaction([createSlabIx], [lpOwner, slabKeypair]);

  console.log('Slab created:', slabKeypair.publicKey.toBase58());
  // NO GOVERNANCE APPROVAL NEEDED!
}
```

#### Step 2: Provide Liquidity (Self-Service)

```typescript
// LP adds liquidity to their slab
async function addLiquidityToMySlab(
  lp: Keypair,
  slabPubkey: PublicKey,
  amount: bigint
) {
  // 1. Reserve collateral in router
  await client.routerReserve(lp, slabPubkey, amount, contextId);

  // 2. Place orders via AdapterLiquidity
  await client.routerLiquidity(lp, slabPubkey, orders);

  // LP now earning fees on their slab!
}
```

#### Step 3: Users Choose Which Slab to Trade

```typescript
// Traders choose which slab to use
async function trade(trader: Keypair, slabChoice: PublicKey) {
  // User picks slab based on:
  // - Best fees
  // - Best liquidity
  // - Best execution
  // - Reputation
  await client.placeOrder(trader, slabChoice, oraclePubkey, params);
}
```

## Revised UI Structure

### Admin UI - What SHOULD Be There

#### 👑 **Governance Section** (Protocol-Wide)

✅ **Global Risk Parameters**
```typescript
<RiskParameters>
  - Initial Margin Ratio (affects ALL slabs)
  - Maintenance Margin Ratio (affects ALL slabs)
  - Liquidation Band (affects ALL positions)
  - Max Oracle Staleness (affects ALL trades)
</RiskParameters>
```

✅ **Oracle Management** (Your Responsibility)
```typescript
<OracleManagement>
  - Create oracles for instruments
  - Update oracle prices
  - Monitor oracle health
</OracleManagement>
```

✅ **Insurance Fund** (Protocol-Level)
```typescript
<InsuranceFund>
  - View insurance balance
  - Top up insurance
  - Withdraw surplus
  - Monitor bad debt coverage
</InsuranceFund>
```

✅ **Emergency Controls** (Protocol-Wide)
```typescript
<EmergencyControls>
  - Global haircut (crisis mode)
  - Emergency parameter updates
  - System monitoring
</EmergencyControls>
```

✅ **Monitoring** (Read-Only)
```typescript
<Monitoring>
  - Total protocol TVL
  - All slabs activity (aggregated)
  - All users across all slabs
  - Global open interest
  - Insurance utilization
</Monitoring>
```

### Admin UI - What SHOULD NOT Be There

❌ **Slab Registration** - Remove this!
- Not governance controlled
- LPs create slabs themselves
- Move to LP interface

❌ **Individual Slab Management** - Not governance
- Each slab has its own owner
- Slab owners manage their slabs
- Governance doesn't control individual slabs

❌ **Fee Configuration (Slab-specific)** - Not governance
- Each slab sets its own fees (within caps)
- Move to slab owner interface
- Governance may set MAX caps only

### LP Interface - What SHOULD Be There

✅ **Slab Management** (LP Self-Service)

```typescript
<SlabManagement>
  {/* Create New Slab */}
  <CreateSlabPanel>
    - Instrument selection
    - Fee configuration (maker/taker)
    - Oracle selection
    - Initialize slab button
  </CreateSlabPanel>

  {/* My Slabs */}
  <MySlabsList>
    - Slabs I own
    - Slab metrics (volume, fees earned)
    - Manage each slab
  </MySlabsList>
</SlabManagement>
```

✅ **Liquidity Provision** (LP Operations)

```typescript
<LiquidityProvision>
  {/* Choose Slab */}
  <SlabSelector>
    - Browse all slabs
    - My slabs
    - Popular slabs
    - Filter by instrument
  </SlabSelector>

  {/* Add Liquidity */}
  <AddLiquidityPanel>
    - Amount to provide
    - Price range (for concentrated liquidity)
    - Order placement strategy
    - Reserve → Liquidity → Release flow
  </AddLiquidityPanel>

  {/* My LP Positions */}
  <MyPositions>
    - Active LP positions
    - Fees earned
    - Remove liquidity
    - Adjust ranges
  </MyPositions>
</LiquidityProvision>
```

### Trader Interface - What SHOULD Be There

✅ **Slab Selection** (User Choice)

```typescript
<SlabSelector>
  {/* Browse Available Slabs */}
  <SlabList>
    {slabs.map(slab => (
      <SlabCard>
        - Instrument: BTC-PERP
        - Fees: 2/5 bps (maker/taker)
        - Liquidity: $10M
        - 24h Volume: $50M
        - Rating: ⭐⭐⭐⭐⭐
      </SlabCard>
    ))}
  </SlabList>

  {/* Or Quick Select */}
  <QuickSelect>
    - Best fees
    - Most liquid
    - Most volume
    - Recommended
  </QuickSelect>
</SlabSelector>
```

## Architecture Comparison

### Centralized Model (Incorrect Understanding)
```
Governance
    |
    ├─ Approves Slab A ✓
    ├─ Approves Slab B ✓
    ├─ Rejects Slab C ✗
    └─ Users trade on approved slabs only
```

### Permissionless Model (Actual Percolator)
```
Anyone
    |
    ├─ Creates Slab A (no approval)
    ├─ Creates Slab B (no approval)
    ├─ Creates Slab C (no approval)
    └─ Users CHOOSE which slab to use (free market)

Governance
    |
    └─ Sets global parameters (IMR, MMR, oracle limits)
       Applied to ALL slabs equally
```

## Benefits of Permissionless Model

✅ **Innovation** - Anyone can create new market structures
✅ **Competition** - Best slabs win based on fees/liquidity
✅ **Decentralization** - No central gatekeeping
✅ **Speed** - No approval delays
✅ **Scalability** - Unlimited slabs without governance bottleneck

## Security Model

### What Protects Users?

1. **Global Risk Parameters** - Governance sets safe defaults for ALL slabs
2. **Router Validation** - Router checks margin requirements uniformly
3. **Oracle Requirements** - All slabs must use valid oracles
4. **Free Market** - Bad slabs get no liquidity/users
5. **Transparency** - All slab code is on-chain/verifiable

### What Governance Guards

🛡️ **Protocol Safety**
- Margin requirements prevent excessive leverage
- Oracle staleness prevents manipulation
- Insurance fund covers bad debt
- Global haircut as last resort

🛡️ **System Integrity**
- Emergency controls for critical bugs
- Parameter updates for changing conditions
- Insurance fund management

## Updated Permission Matrix

| Action | Governance | Slab Owner | LP | Trader |
|--------|-----------|------------|-----|--------|
| **Set Global IMR/MMR** | ✅ | ❌ | ❌ | ❌ |
| **Set Oracle Staleness** | ✅ | ❌ | ❌ | ❌ |
| **Manage Insurance** | ✅ | ❌ | ❌ | ❌ |
| **Emergency Controls** | ✅ | ❌ | ❌ | ❌ |
| **Create Oracle** | ✅ | ❌ | ❌ | ❌ |
| **Update Oracle** | ✅ | ❌ | ❌ | ❌ |
| **Create Slab** | ❌ | ✅ | ✅ | ❌ |
| **Set Slab Fees** | ❌ | ✅ | ❌ | ❌ |
| **Manage Slab** | ❌ | ✅ | ❌ | ❌ |
| **Add Liquidity** | ❌ | ✅ | ✅ | ❌ |
| **Remove Liquidity** | ❌ | ✅ | ✅ | ❌ |
| **Choose Slab** | ❌ | ❌ | ✅ | ✅ |
| **Trade** | ❌ | ❌ | ❌ | ✅ |

## Example User Flows

### Flow 1: LP Creates Slab (Permissionless!)
```
1. LP goes to LP interface
2. Clicks "Create New Slab"
3. Selects instrument (BTC-PERP)
4. Sets fees (maker: 2bps, taker: 5bps)
5. Selects oracle (governance-managed oracle)
6. Clicks "Create Slab" → Transaction
7. Slab is live! (no governance approval needed)
8. LP adds liquidity to their slab
9. LP starts earning fees
```

### Flow 2: Trader Chooses Slab (Free Market)
```
1. Trader goes to trade interface
2. Wants to trade BTC-PERP
3. Sees dropdown of available slabs:
   - Slab A: 2/5 bps, $10M liquidity ⭐ Most popular
   - Slab B: 1/3 bps, $1M liquidity (lower fees!)
   - Slab C: 3/7 bps, $5M liquidity
4. Trader picks Slab B (best fees)
5. Places order on Slab B
6. Free market at work!
```

### Flow 3: Governance Sets Safety (Protocol-Wide)
```
1. Admin sees too much leverage in system
2. Updates global IMR from 5% to 7%
3. ALL slabs now require 7% margin
4. Protects entire protocol
5. Individual slab owners can't override safety parameters
```

## Implementation Priorities

### Phase 1: Fix Admin UI
- ❌ Remove "Register Slab" functionality
- ✅ Keep global risk parameters
- ✅ Keep oracle management
- ✅ Keep insurance fund management
- ✅ Update documentation

### Phase 2: Enhance LP UI
- ✅ Add "Create Slab" wizard
- ✅ Add "My Slabs" management
- ✅ Add slab configuration (fees, etc.)
- ✅ Keep liquidity provision features

### Phase 3: Enhance Trader UI
- ✅ Add slab selector dropdown
- ✅ Add slab comparison view
- ✅ Add "Popular Slabs" section
- ✅ Add slab metrics (fees, liquidity, volume)

## Summary

🎯 **Key Insight:** Percolator is **permissionless** at the slab level, but **governed** at the protocol level.

**Governance Controls:**
- ✅ Protocol-wide safety (margin, liquidation, oracles)
- ✅ Insurance fund
- ✅ Emergency controls

**LPs Control:**
- ✅ Creating slabs (permissionless!)
- ✅ Setting slab fees
- ✅ Managing their liquidity

**Users Control:**
- ✅ Which slab to trade on (free choice!)
- ✅ Competition drives best execution

**This is a DeFi superpower** - combines permissionless innovation with protocol-level safety!

---

## References

- `programs/common/src/state/registry.rs:5-9` - Whitelist-free confirmation
- `programs/router/src/entrypoint.rs:40` - RegisterSlab removed
- `cli/src/exchange.rs:201, 264` - "Slabs are permissionless" messages
- `cli/src/matcher.rs:244` - "No whitelist required" comment
