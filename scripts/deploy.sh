#!/bin/bash

# Bitreon Contract Deployment Script
# This script deploys the bitreon-core contract to Stacks testnet

echo "🚀 Deploying Bitreon Core Contract to Testnet..."

# Check if Clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "❌ Clarinet is not installed. Please install it first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://install.clarinet.so | sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Clarinet.toml" ]; then
    echo "❌ Clarinet.toml not found. Please run this script from the project root."
    exit 1
fi

# Run contract checks
echo "🔍 Running contract checks..."
clarinet check

if [ $? -ne 0 ]; then
    echo "❌ Contract check failed. Please fix the errors before deploying."
    exit 1
fi

# Deploy to testnet
echo "📦 Deploying to testnet..."
clarinet deployments apply --network testnet

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo "📝 Please update your NEXT_PUBLIC_CONTRACT_ADDRESS environment variable"
    echo "   with the deployed contract address from the output above."
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
