import { 
  fetchCallReadOnlyFunction,
  cvToJSON, 
  uintCV, 
  stringAsciiCV, 
  stringUtf8CV,
  standardPrincipalCV,
  PostConditionMode,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  ClarityValue
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// Use the testnet network configuration
const network = STACKS_TESTNET;

// Helper function to call read-only functions
async function callContractReadOnly({
  contractAddress,
  contractName,
  functionName,
  functionArgs,
  senderAddress
}: {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}) {
  return fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress
  });
}
import { useUser } from './use-user';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST2S5RQ13X74V6D2GX9QRX7K89QMB2XTFJWFATZ6Y';
const CONTRACT_NAME = 'bitreon-core';

// Network is already initialized above

// Types based on the contract interface
export interface Creator {
  'bns-name': string;
  'display-name': string;
  bio: string;
  category: string;
  'subscription-price': string;
  benefits: string;
  active: boolean;
  'created-at': string;
  'updated-at': string;
  owner: string;
  'creator-id'?: string;
}

export interface Subscription {
  'subscription-id': string;
  subscriber: string;
  'creator-id': string;
  'amount-paid': string;
  'expires-at': string;
  active: boolean;
  'created-at': string;
  'last-renewed': string;
  'auto-renew': boolean;
  metadata?: string;
}

export interface NFTCertificate {
  'token-id': string;
  owner: string;
  'creator-id': string;
  'subscription-id': string;
  'minted-at': string;
  metadata?: string;
}

export interface ContractInfo {
  name: string;
  version: string;
  description: string;
  'nft-standard': string;
  'contract-owner': string;
  'is-paused': boolean;
}

/**
 * Get creator by ID
 * @param creatorId The creator's ID
 * @returns Creator data or null if not found
 */
export async function getCreator(creatorId: number): Promise<Creator | null> {
  try {
    const result = await callContractReadOnly({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-creator',
      functionArgs: [uintCV(creatorId)],
      senderAddress: CONTRACT_ADDRESS // Using contract address as sender for read-only
    });

    if (result) {
      const json = cvToJSON(result);
      return json.value as Creator;
    }
    return null;
  } catch (error) {
    console.error('Error fetching creator:', error);
    throw new Error('Failed to fetch creator data');
  }
}

/**
 * Get creator by BNS name
 * @param bnsName The BNS name of the creator
 * @returns Creator data or null if not found
 */
export async function getCreatorByBNS(bnsName: string): Promise<Creator | null> {
  try {
    const result = await callContractReadOnly({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-creator-by-bns',
      functionArgs: [stringAsciiCV(bnsName)],
      senderAddress: CONTRACT_ADDRESS
    });

    const json = cvToJSON(result);
    return json.value ? json.value : null;
  } catch (error) {
    console.error('Error fetching creator by BNS:', error);
    throw new Error('Failed to fetch creator by BNS');
  }
}

/**
 * Get creator by owner address
 * @param ownerAddress The Stacks address of the creator
 * @returns Creator data or null if not found
 */
export async function getCreatorByOwner(ownerAddress: string): Promise<Creator | null> {
  try {
    const result = await callContractReadOnly({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-creator-by-owner',
      functionArgs: [standardPrincipalCV(ownerAddress)],
      senderAddress: CONTRACT_ADDRESS
    });

    const json = cvToJSON(result);
    return json.value ? json.value : null;
  } catch (error) {
    console.error('Error fetching creator by owner:', error);
    throw new Error('Failed to fetch creator by owner');
  }
}

/**
 * Get subscription by ID
 * @param subscriptionId The subscription ID
 * @returns Subscription data or null if not found
 */
export async function getSubscription(subscriptionId: number): Promise<Subscription | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-subscription',
      functionArgs: [uintCV(subscriptionId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    if (json.value) {
      return { ...json.value, 'subscription-id': subscriptionId.toString() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw new Error('Failed to fetch subscription');
  }
}

/**
 * Get user's subscription to a specific creator
 * @param userAddress The subscriber's Stacks address
 * @param creatorId The creator's ID
 * @returns Subscription data or null if not found
 */
export async function getUserSubscription(userAddress: string, creatorId: number): Promise<Subscription | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-user-subscription',
      functionArgs: [
        standardPrincipalCV(userAddress),
        uintCV(creatorId)
      ],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    return json.value ? json.value : null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw new Error('Failed to fetch user subscription');
  }
}

/**
 * Check if a user is subscribed to a creator
 * @param userAddress The user's Stacks address
 * @param creatorId The creator's ID
 * @returns Boolean indicating subscription status
 */
export async function isUserSubscribed(userAddress: string, creatorId: number): Promise<boolean> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'is-subscribed',
      functionArgs: [
        standardPrincipalCV(userAddress),
        uintCV(creatorId)
      ],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    return json.value === true;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw new Error('Failed to check subscription status');
  }
}

/**
 * Get contract information
 * @returns Contract information including name, version, etc.
 */
export async function getContractInfo(): Promise<ContractInfo> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-contract-info',
      functionArgs: [],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    if (json.value) {
      return json.value;
    }
    throw new Error('No contract info found');
  } catch (error) {
    console.error('Error fetching contract info:', error);
    throw new Error('Failed to fetch contract information');
  }
}

/**
 * Get NFT certificate by token ID
 * @param tokenId The NFT token ID
 * @returns NFT certificate data or null if not found
 */
export async function getNFTCertificate(tokenId: number): Promise<NFTCertificate | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-nft-badge',
      functionArgs: [uintCV(tokenId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const json = cvToJSON(result);
    if (json.value) {
      return { ...json.value, 'token-id': tokenId.toString() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching NFT certificate:', error);
    throw new Error('Failed to fetch NFT certificate');
  }
}

/**
 * Hook for interacting with the Bitreon contract
 * Provides functions for registering as a creator and subscribing to creators
 */
export function useBitreonContract() {
  const { userData, userAddress } = useUser();

  /**
   * Register as a creator
   * @param bnsName The BNS name to register
   * @param displayName Display name for the creator
   * @param bio Creator bio
   * @param category Content category
   * @param subscriptionPrice Subscription price in STX (in microSTX)
   * @param benefits Description of subscription benefits
   * @param metadata Optional metadata string
   */
  const registerCreator = async (
    bnsName: string,
    displayName: string,
    bio: string,
    category: string,
    subscriptionPrice: number,
    benefits: string,
    metadata: string = ''
  ) => {
    if (!userData || !userAddress) {
      throw new Error('User not authenticated');
    }

    try {
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'register-creator',
        functionArgs: [
          stringAsciiCV(bnsName),
          stringUtf8CV(displayName),
          stringUtf8CV(bio),
          stringAsciiCV(category),
          uintCV(subscriptionPrice),
          stringUtf8CV(benefits),
          metadata ? stringUtf8CV(metadata) : stringUtf8CV('')
        ],
        senderKey: userData.appPrivateKey,
        validateWithAbi: true,
        network,
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
      };

      // This would be implemented with @stacks/connect
      // For now, we'll just return a mock response
      console.log('Registering creator with options:', txOptions);
      return { success: true, txId: 'mock-tx-id' };
    } catch (error) {
      console.error('Error registering creator:', error);
      throw new Error('Failed to register creator');
    }
  };

  /**
   * Subscribe to a creator
   * @param creatorId The ID of the creator to subscribe to
   * @param duration Duration of subscription in blocks
   * @param autoRenew Whether to automatically renew the subscription
   * @param metadata Optional metadata string
   */
  const subscribeToCreator = async (
    creatorId: number,
    duration: number,
    autoRenew: boolean = false,
    metadata: string = ''
  ) => {
    if (!userData || !userAddress) {
      throw new Error('User not authenticated');
    }

    try {
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'subscribe',
        functionArgs: [
          uintCV(creatorId),
          uintCV(duration),
          autoRenew ? stringAsciiCV('true') : stringAsciiCV('false'),
          metadata ? stringUtf8CV(metadata) : stringUtf8CV('')
        ],
        senderKey: userData.appPrivateKey,
        validateWithAbi: true,
        network,
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any
      };

      // This would be implemented with @stacks/connect
      // For now, we'll just return a mock response
      console.log('Subscribing with options:', txOptions);
      return { success: true, txId: 'mock-tx-id' };
    } catch (error) {
      console.error('Error subscribing to creator:', error);
      throw new Error('Failed to subscribe to creator');
    }
  };

  return {
    registerCreator,
    subscribeToCreator,
  };
}
