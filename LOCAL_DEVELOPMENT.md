# Local Development Setup

Quick guide to run Sonalex with a local Solana test validator.

## Prerequisites

- Solana CLI tools installed (`solana --version`)
- Node.js and npm installed
- Percolator repository available (optional, for deploying programs)

## Quick Start

### 1. Start Local Test Validator

```bash
# In a separate terminal
solana-test-validator --reset
```

This starts a local Solana validator on `http://localhost:8899`.

### 2. Configure Sonalex

Create `.env.local`:

```bash
# In the sonalex directory
cat > .env.local << 'EOF'
# Local test validator
NEXT_PUBLIC_RPC_URL=http://localhost:8899

# Your development wallet (get from: solana address)
NEXT_PUBLIC_GOVERNANCE_WALLET=YourDevWalletPublicKeyHere
NEXT_PUBLIC_INSURANCE_AUTHORITY=YourDevWalletPublicKeyHere

# Placeholder program IDs (replace after deploying Percolator)
NEXT_PUBLIC_ROUTER_PROGRAM_ID=11111111111111111111111111111111
NEXT_PUBLIC_SLAB_PROGRAM_ID=11111111111111111111111111111111
NEXT_PUBLIC_AMM_PROGRAM_ID=11111111111111111111111111111111

# Dev mode
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_ENABLE_MULTISIG=false
EOF
```

### 3. Get Your Wallet Address

```bash
# If you have Solana CLI configured
solana address

# Or generate a new dev wallet
solana-keygen new --outfile ~/.config/solana/devnet-dev.json
solana config set --keypair ~/.config/solana/devnet-dev.json
solana address
```

Copy the public key and update `NEXT_PUBLIC_GOVERNANCE_WALLET` in `.env.local`.

### 4. Airdrop SOL

```bash
# Give yourself 10 SOL for testing
solana airdrop 10 -u localhost

# Verify balance
solana balance -u localhost
```

### 5. Start Sonalex

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Configure Your Wallet

Make sure your browser wallet is connected to localhost:

**Phantom:**
1. Settings → Developer Settings
2. Change Network → Localhost
3. Testnet/Devnet mode → Select "Localhost"

**Solflare:**
1. Network selector (top right)
2. Add Custom RPC
3. URL: `http://localhost:8899`
4. Name: "Localhost"

### 7. Test Connection

1. Visit `http://localhost:3000`
2. Click "Connect Wallet"
3. Approve connection
4. You should see your wallet connected!

## Deploy and Initialize Percolator

If you have the Percolator repository and want to test with real programs:

### Step 1: Deploy Programs

```bash
# Terminal 1: Test validator (already running)
solana-test-validator --reset

# Terminal 2: Deploy Percolator
cd ../percolator

# Build programs
anchor build

# Deploy to localhost
anchor deploy --provider.cluster localnet

# Get program IDs
solana address -k target/deploy/router-keypair.json
solana address -k target/deploy/slab-keypair.json
solana address -k target/deploy/amm-keypair.json
```

### Step 2: Initialize Protocol with Percolator CLI

The Percolator CLI creates the registry and insurance vault accounts:

```bash
# Still in percolator directory
cargo run --bin percolator -- initialize \
  --governance <your-wallet-pubkey> \
  --insurance-authority <your-wallet-pubkey> \
  --cluster localnet

# CLI will output:
# ✅ Registry created: <registry-address>
# ✅ Insurance vault created: <vault-address>
# ✅ Protocol initialized!
#
# Add these to your Sonalex .env.local:
# NEXT_PUBLIC_REGISTRY_ADDRESS=<registry-address>
# NEXT_PUBLIC_INSURANCE_VAULT=<vault-address>
```

### Step 3: Update Sonalex Configuration

Update `.env.local` with all the addresses:

```bash
# Program IDs (from anchor deploy)
NEXT_PUBLIC_ROUTER_PROGRAM_ID=<router-program-id>
NEXT_PUBLIC_SLAB_PROGRAM_ID=<slab-program-id>
NEXT_PUBLIC_AMM_PROGRAM_ID=<amm-program-id>

# Account addresses (from percolator CLI initialize)
NEXT_PUBLIC_REGISTRY_ADDRESS=<registry-address>
NEXT_PUBLIC_INSURANCE_VAULT=<vault-address>
```

Restart Sonalex (`npm run dev`) to pick up the configuration.

## Full Development Workflow

Here's the complete terminal setup:

```bash
# Terminal 1: Local validator
solana-test-validator --reset --log

# Terminal 2: Deploy and initialize Percolator
cd ../percolator

# Build and deploy
anchor build
anchor deploy --provider.cluster localnet

# Initialize protocol (creates registry + insurance vault)
cargo run --bin percolator -- initialize \
  --governance $(solana address) \
  --insurance-authority $(solana address) \
  --cluster localnet

# Copy the output addresses to sonalex/.env.local

# Terminal 3: Sonalex
cd ../sonalex
# Update .env.local with addresses from CLI output
npm run dev
```

## Environment Variables Explained

```bash
# =============================================================================
# Network
# =============================================================================
NEXT_PUBLIC_RPC_URL=http://localhost:8899
# Connects to local test validator instead of devnet/mainnet

# =============================================================================
# Authorities
# =============================================================================
NEXT_PUBLIC_GOVERNANCE_WALLET=YourPubkey...
# Your wallet = governance authority (can update risk params, oracles, etc.)

NEXT_PUBLIC_INSURANCE_AUTHORITY=YourPubkey...
# Can be same wallet for local dev

# =============================================================================
# Programs (3 programs only!)
# =============================================================================
NEXT_PUBLIC_ROUTER_PROGRAM_ID=11111...
# Main Percolator program (coordinates everything)

NEXT_PUBLIC_SLAB_PROGRAM_ID=11111...
# Order book matching program

NEXT_PUBLIC_AMM_PROGRAM_ID=11111...
# Automated market maker program

# NOTE: No ORACLE_PROGRAM_ID!
# Oracles are accounts managed by the Router program, not a separate program

# =============================================================================
# Features
# =============================================================================
NEXT_PUBLIC_DEV_MODE=true
# Enables extra logging and debug features

NEXT_PUBLIC_ENABLE_MULTISIG=false
# Disable multisig for local dev (single wallet is easier)
```

## Common Issues

### Issue: "Failed to connect to localhost:8899"

**Fix:** Make sure test validator is running:
```bash
solana cluster-version -u localhost
```

Should show version info. If not, start validator:
```bash
solana-test-validator
```

### Issue: Wallet shows wrong network

**Fix:** Switch wallet to Localhost network (see step 6 above).

### Issue: "Insufficient funds"

**Fix:** Airdrop more SOL:
```bash
solana airdrop 10 -u localhost
```

### Issue: Page shows "Connect Wallet" but nothing happens

**Fix:**
1. Check wallet is on Localhost network
2. Refresh page
3. Clear site data (browser dev tools → Application → Clear site data)
4. Try connecting again

### Issue: "Registry not found" or similar errors

**Fix:** You need to initialize the protocol using Percolator CLI:

```bash
cd ../percolator
cargo run --bin percolator -- initialize \
  --governance $(solana address) \
  --cluster localnet
```

Then copy the output addresses to `.env.local`.

### Issue: Programs not found

**Fix:** You're using placeholder program IDs. Deploy Percolator:

```bash
cd ../percolator
anchor build
anchor deploy --provider.cluster localnet
```

Then update `.env.local` with the real program IDs.

### Issue: Oracle errors

Remember: Oracles are NOT a separate program! If you deployed Percolator, oracle accounts are created by the Router program using the admin UI.

## Resetting Everything

If things get messed up:

```bash
# Stop all running processes (Ctrl+C in each terminal)

# Reset test validator
solana-test-validator --reset

# Clear Next.js cache
rm -rf .next

# Restart everything
solana-test-validator    # Terminal 1
npm run dev              # Terminal 2
```

## Production vs Development

| Configuration | Development | Production |
|--------------|-------------|------------|
| **RPC** | `http://localhost:8899` | `https://api.mainnet-beta.solana.com` |
| **Governance** | Your dev wallet | Squads multisig |
| **Insurance** | Same as governance | Separate wallet/multisig |
| **Programs** | Deployed to localhost | Deployed to mainnet |
| **Multisig** | Disabled | Enabled |
| **Dev Mode** | Enabled | Disabled |

## Next Steps

Once you have Sonalex running locally:

1. ✅ Test wallet connection
2. ✅ Visit `/admin` page
3. ✅ Check permission system works
4. ✅ Deploy Percolator programs (optional)
5. ✅ Test oracle creation (requires deployed programs)
6. ✅ Test trading interface (requires deployed programs + oracles)

## Resources

- Solana Test Validator Docs: https://docs.solana.com/developing/test-validator
- Anchor Local Testing: https://www.anchor-lang.com/docs/cli
- Solana CLI Reference: https://docs.solana.com/cli

Happy hacking! 🚀
