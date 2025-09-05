# Bitreon Core Smart Contract

Bitreon is a cutting-edge, decentralized platform built on the Stacks blockchain that redefines how creators connect with their most dedicated fans. Our platform leverages smart contracts to create transparent, trustless relationships between creators and their communities through subscription-based memberships and exclusive digital collectibles.

## Core Functionality

### Creator Management
- `register-creator`: Register a new creator profile
- `update-creator`: Update creator profile information
- `get-creator`: Retrieve creator details
- `get-creator-by-address`: Find creator by wallet address

### Subscription Management
- `create-subscription`: Create a new subscription plan
- `subscribe`: Subscribe to a creator's content
- `renew-subscription`: Renew an existing subscription
- `cancel-subscription`: Cancel an active subscription
- `get-subscription`: Get subscription details
- `get-subscriber-count`: Get number of subscribers for a creator

### NFT Badges (SIP-009)
- `mint-badge`: Mint a new NFT badge for a subscriber
- `transfer`: Transfer an NFT badge to another address
- `get-owner`: Get the owner of an NFT badge
- `get-token-uri`: Get metadata URI for an NFT badge
- `get-last-token-id`: Get the ID of the most recently minted badge

### Utility Functions
- `update-block-height`: Update the current block height (for time-based operations)
- `non-reentrant`: Security guard against reentrancy attacks
- `is-owner?`: Check if caller is the contract owner
- `validate-creator-inputs`: Validate creator profile data

## Security Features
- Reentrancy protection
- Input validation
- Owner-only functions for sensitive operations
- Pause functionality for emergency stops

## Error Codes
- `ERR_NOT_OWNER (u100)`: Caller is not the contract owner
- `ERR_REENTRANCY (u101)`: Reentrant call detected
- `ERR_NOT_FOUND (u102)`: Requested resource not found
- `ERR_ALREADY_EXISTS (u103)`: Resource already exists
- `ERR_INSUFFICIENT_PAYMENT (u104)`: Payment amount is insufficient
- `ERR_SUBSCRIPTION_EXPIRED (u105)`: Subscription has expired
- `ERR_UNAUTHORIZED (u106)`: Caller is not authorized
- `ERR_INVALID_INPUT (u107)`: Invalid input parameters
- `ERR_PAUSED (u108)`: Contract is paused
- `ERR_INVALID_CREATOR (u109)`: Invalid creator specified
- `ERR_INVALID_SUBSCRIPTION (u110)`: Invalid subscription specified
- `ERR_TRANSFER_FAILED (u111)`: Token transfer failed
- `ERR_MINT_FAILED (u112)`: NFT minting failed
- `ERR_NFT_NOT_FOUND (u113)`: NFT not found

## Constants
- `MIN_SUBSCRIPTION_PRICE`: Minimum subscription price (1000 uSTX)
- `SUBSCRIPTION_DURATION`: Default subscription duration in blocks (10080 blocks ≈ 7 days)
