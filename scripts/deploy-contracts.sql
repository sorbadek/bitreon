-- Deployment script for Bitreon smart contracts
-- This would be executed on the Stacks blockchain

-- Deploy the main Bitreon contract
-- Contract: bitreon-core.clar
-- Address: Will be determined upon deployment

-- Initial setup queries for tracking contract deployment
CREATE TABLE IF NOT EXISTS contract_deployments (
    id SERIAL PRIMARY KEY,
    contract_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(100) NOT NULL,
    deployer_address VARCHAR(100) NOT NULL,
    deployment_tx VARCHAR(100) NOT NULL,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    network VARCHAR(20) DEFAULT 'testnet'
);

-- Insert deployment record (to be updated with actual values)
INSERT INTO contract_deployments (
    contract_name, 
    contract_address, 
    deployer_address, 
    deployment_tx,
    network
) VALUES (
    'bitreon-core',
    'ST2S5RQ13X74V6D2GX9QRX7K89QMB2XTFJWFATZ6Y.bitreon-core',
    'ST2S5RQ13X74V6D2GX9QRX7K89QMB2XTFJWFATZ6Y',
    'pending',
    'testnet'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contract_name ON contract_deployments(contract_name);
CREATE INDEX IF NOT EXISTS idx_contract_address ON contract_deployments(contract_address);
CREATE INDEX IF NOT EXISTS idx_network ON contract_deployments(network);
