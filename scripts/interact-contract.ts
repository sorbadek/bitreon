import { 
  cvToValue, 
  uintCV, 
  standardPrincipalCV, 
  trueCV, 
  falseCV, 
  someCV, 
  noneCV, 
  stringAsciiCV, 
  stringUtf8CV,
  fetchCallReadOnlyFunction 
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// Configuration
const CONTRACT_ADDRESS = 'ST2S5RQ13X74V6D2GX9QRX7K89QMB2XTFJWFATZ6Y';
const CONTRACT_NAME = 'bitreon-core';
const NETWORK = STACKS_TESTNET;

// Helper function to call read-only functions
async function callReadOnly(
  functionName: string,
  args: any[] = [],
  sender: string = CONTRACT_ADDRESS
) {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName,
      functionArgs: args,
      network: NETWORK,
      senderAddress: sender,
    });
    return cvToValue(result);
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

// Function to interact with the contract's public functions
export class BitreonContract {
  // Admin Functions
  static async updateBlockHeight(newHeight: number) {
    return await callReadOnly('update-block-height', [uintCV(newHeight)]);
  }

  static async nonReentrant() {
    return await callReadOnly('non-reentrant');
  }

  // Creator Functions
  static async registerCreator(
    bnsName: string,
    displayName: string,
    bio: string,
    category: string,
    subscriptionPrice: number,
    benefits: string,
    metadata?: string
  ) {
    const args = [
      stringAsciiCV(bnsName),
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
      stringUtf8CV(category),
      uintCV(subscriptionPrice),
      stringUtf8CV(benefits),
      metadata ? someCV(stringUtf8CV(metadata)) : noneCV()
    ];
    return await callReadOnly('register-creator', args);
  }

  static async updateCreator(
    creatorId: number,
    displayName?: string,
    bio?: string,
    category?: string,
    subscriptionPrice?: number,
    benefits?: string,
    metadata?: string
  ) {
    const args = [
      uintCV(creatorId),
      displayName ? someCV(stringUtf8CV(displayName)) : noneCV(),
      bio ? someCV(stringUtf8CV(bio)) : noneCV(),
      category ? someCV(stringUtf8CV(category)) : noneCV(),
      subscriptionPrice !== undefined ? someCV(uintCV(subscriptionPrice)) : noneCV(),
      benefits ? someCV(stringUtf8CV(benefits)) : noneCV(),
      metadata ? someCV(stringUtf8CV(metadata)) : noneCV()
    ];
    return await callReadOnly('update-creator', args);
  }

  static async deactivateCreator(creatorId: number) {
    return await callReadOnly('deactivate-creator', [uintCV(creatorId)]);
  }

  // Subscription Functions
  static async subscribe(
    creatorId: number,
    duration: number,
    autoRenew: boolean,
    metadata?: string
  ) {
    const args = [
      uintCV(creatorId),
      uintCV(duration),
      autoRenew ? trueCV() : falseCV(),
      metadata ? someCV(stringUtf8CV(metadata)) : noneCV()
    ];
    return await callReadOnly('subscribe', args);
  }

  // NFT Functions (SIP-009)
  static async getTokenUri(tokenId: number) {
    return await callReadOnly('get-token-uri', [uintCV(tokenId)]);
  }

  static async getOwner(tokenId: number) {
    return await callReadOnly('get-owner', [uintCV(tokenId)]);
  }

  // Read-only functions
  static async getCreator(creatorId: number) {
    return await callReadOnly('get-creator', [uintCV(creatorId)]);
  }

  static async getSubscription(subscriptionId: number) {
    return await callReadOnly('get-subscription', [uintCV(subscriptionId)]);
  }

  static async getCreatorByOwner(owner: string) {
    return await callReadOnly('get-creator-by-owner', [standardPrincipalCV(owner)]);
  }

  static async getCreatorByBns(bnsName: string) {
    return await callReadOnly('get-creator-by-bns', [stringAsciiCV(bnsName)]);
  }

  static async getActiveSubscription(subscriber: string, creatorId: number) {
    return await callReadOnly('get-active-subscription', [
      standardPrincipalCV(subscriber),
      uintCV(creatorId)
    ]);
  }
}

// Example usage
async function main() {
  try {
    // Example: Get creator info
    const creatorId = 1;
    const creator = await BitreonContract.getCreator(creatorId);
    console.log('Creator:', creator);

    // Example: Get active subscription
    const subscriber = 'ST2S5RQ13X74V6D2GX9QRX7K89QMB2XTFJWFATZ6Y';
    const subscription = await BitreonContract.getActiveSubscription(subscriber, creatorId);
    console.log('Active Subscription:', subscription);

    // Example: Get NFT owner
    const tokenId = 1;
    const owner = await BitreonContract.getOwner(tokenId);
    console.log('NFT Owner:', owner);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment to run the example
// main();
