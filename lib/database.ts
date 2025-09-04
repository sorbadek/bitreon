import { callContractReadOnly } from './blockchain/contract';

// Types for our blockchain data model
export interface Creator {
  id: string;
  stacks_address: string;
  bns_name: string;
  display_name: string;
  bio?: string;
  category?: string;
  subscription_price_sats: number;
  subscriber_count: number;
  total_earnings_sats: number;
  verified: boolean;
  avatar_url?: string;
  banner_url?: string;
  benefits?: string[];
}

export interface Subscription {
  id: string;
  creator_id: string;
  subscriber_address: string;
  price_paid_sats: number;
  start_timestamp: number;
  end_timestamp: number;
  active: boolean;
}

export interface Post {
  id: string;
  creator_id: string;
  title: string;
  content: string;
  is_premium: boolean;
  timestamp: number;
}

// Client-side data fetching
export async function getAllCreators(): Promise<Creator[]> {
  try {
    const result = await callContractReadOnly('get-creators-page', [
      { type: 'uint', value: '0' }, // offset
      { type: 'uint', value: '100' } // limit
    ]);
    
    // Transform the blockchain response to match our Creator interface
    return result.value.creators.map((creator: any) => ({
      id: creator.id.value,
      stacks_address: creator.creator_address.value,
      bns_name: creator.bns_name.value,
      display_name: creator.display_name.value,
      bio: creator.bio?.value,
      category: creator.category?.value,
      subscription_price_sats: parseInt(creator.subscription_price_sats.value),
      subscriber_count: parseInt(creator.subscriber_count.value),
      total_earnings_sats: parseInt(creator.total_earnings_sats.value),
      verified: creator.verified?.value || false,
      avatar_url: creator.avatar_url?.value,
      banner_url: creator.banner_url?.value,
      benefits: creator.benefits?.value
    }));
  } catch (error) {
    console.error('Error fetching creators from blockchain:', error);
    return [];
  }
}

export async function getCreatorByBnsName(bnsName: string): Promise<Creator | null> {
  try {
    const creators = await getAllCreators();
    return creators.find(creator => creator.bns_name === bnsName) || null;
  } catch (error) {
    console.error('Error fetching creator by BNS name:', error);
    return null;
  }
}

export async function getCreatorPosts(creatorId: string): Promise<Post[]> {
  try {
    const result = await callContractReadOnly('get-creator-posts', [
      { type: 'uint', value: creatorId },
      { type: 'uint', value: '0' }, // offset
      { type: 'uint', value: '100' } // limit
    ]);
    
    return result.value.posts.map((post: any) => ({
      id: post.id.value,
      creator_id: post.creator_id.value,
      title: post.title.value,
      content: post.content.value,
      is_premium: post.is_premium.value,
      timestamp: parseInt(post.timestamp.value)
    }));
  } catch (error) {
    console.error('Error fetching creator posts:', error);
    return [];
  }
}

export async function getUserSubscriptions(userAddress: string): Promise<Subscription[]> {
  try {
    const result = await callContractReadOnly('get-user-subscriptions', [
      { type: 'principal', value: userAddress }
    ]);
    
    return result.value.subscriptions.map((sub: any) => ({
      id: sub.id.value,
      creator_id: sub.creator_id.value,
      subscriber_address: sub.subscriber_address.value,
      price_paid_sats: parseInt(sub.price_paid_sats.value),
      start_timestamp: parseInt(sub.start_timestamp.value),
      end_timestamp: parseInt(sub.end_timestamp.value),
      active: sub.active.value
    }));
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return [];
  }
}

export async function checkUserSubscription(creatorId: string, userAddress: string): Promise<Subscription | null> {
  try {
    const subscriptions = await getUserSubscriptions(userAddress);
    const now = Math.floor(Date.now() / 1000);
    
    return subscriptions.find(
      sub => sub.creator_id === creatorId && 
             sub.active && 
             sub.end_timestamp > now
    ) || null;
  } catch (error) {
    console.error('Error checking user subscription:', error);
    return null;
  }
}

// These functions would be replaced with actual blockchain transactions
export async function createSubscription(
  subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>,
): Promise<null> {
  // This would be handled by a smart contract call
  console.log('Creating subscription on blockchain:', subscription);
  return null;
}

export async function recordTransaction(
  transaction: any
): Promise<null> {
  // This would be handled by the blockchain
  console.log('Recording transaction on blockchain:', transaction);
  return null;
}

// Server-side functions - these would interact with the blockchain directly
export async function getCreatorByAddress(address: string): Promise<Creator | null> {
  try {
    const creators = await getAllCreators();
    return creators.find(creator => creator.stacks_address === address) || null;
  } catch (error) {
    console.error('Error fetching creator by address:', error);
    return null;
  }
}

export async function createCreator(
  creator: Omit<Creator, 'id' | 'created_at' | 'updated_at'>
): Promise<null> {
  // This would be handled by a smart contract call
  console.log('Creating creator on blockchain:', creator);
  return null;
}

// Utility functions
export function satoshisToBTC(satoshis: number): number {
  return satoshis / 100000000;
}

export function btcToSatoshis(btc: number): number {
  return Math.round(btc * 100000000);
}

export function formatSatoshis(satoshis: number): string {
  return (satoshis / 100000000).toFixed(8);
}
