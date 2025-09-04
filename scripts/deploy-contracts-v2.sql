-- Deploy Bitreon Core Contract to Testnet
-- This script deploys the bitreon-core.clar contract

-- First, we need to ensure the contract is deployed to the correct address
-- The contract should be deployed using the Stacks CLI or Clarinet

-- For testnet deployment, use:
-- clarinet deployments apply --network testnet

-- Contract deployment details:
-- Contract Name: bitreon-core
-- Network: Stacks Testnet
-- Expected Address: Will be generated after deployment

-- After deployment, update the NEXT_PUBLIC_CONTRACT_ADDRESS environment variable
-- with the actual deployed contract address

-- Verify deployment with:
-- curl "https://api.testnet.hiro.so/v2/contracts/interface/[CONTRACT_ADDRESS]/bitreon-core"

SELECT 'Contract deployment script created. Please deploy using Stacks CLI or Clarinet.' as status;
