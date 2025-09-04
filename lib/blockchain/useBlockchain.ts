import { useQuery } from '@tanstack/react-query';
import { STACKS_TESTNET, StacksNetwork } from '@stacks/network';
import { userSession } from '@/components/BlockchainProvider';

declare global {
  interface Window {
    StacksConnect: {
      redirectToSignIn: () => Promise<void>;
    };
  }
}

const network = STACKS_TESTNET;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export function useBlockchain() {
  const isConnected = userSession.isUserSignedIn();
  const userData = isConnected ? userSession.loadUserData() : null;
  const userAddress = userData?.profile?.stxAddress?.testnet || '';

  const connectWallet = async () => {
    if (!isConnected) {
      // For @stacks/connect v7+, we need to use the connect function from the library
      // This will trigger the wallet connection flow
      window.StacksConnect.redirectToSignIn();
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
  };

  const callContract = async (functionName: string, args: any[] = []) => {
    if (!userAddress) throw new Error('User not connected');
    
    const networkUrl = (network as any).url || 'https://stacks-node-api.testnet.stacks.co';
    const response = await fetch(
      `${networkUrl}/extended/v1/contract/call-readonly/${CONTRACT_ADDRESS}/bitreon-core/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: userAddress,
          arguments: args,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to call contract');
    }
    
    return await response.json();
  };

  return {
    isConnected,
    userAddress,
    connectWallet,
    disconnectWallet,
    callContract,
  };
}

export function useCreator(creatorId: string) {
  return useQuery({
    queryKey: ['creator', creatorId],
    queryFn: async () => {
      const networkUrl = (network as any).url || 'https://stacks-node-api.testnet.stacks.co';
      const response = await fetch(
        `${networkUrl}/extended/v1/contract/call-readonly/${CONTRACT_ADDRESS}/bitreon-core/get-creator?args=${encodeURIComponent(JSON.stringify([{ type: 'uint', value: creatorId }]))}`
      );
      const data = await response.json();
      return data.result;
    },
    enabled: !!creatorId,
  });
}

export function useCreators() {
  return useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      const networkUrl = (network as any).url || 'https://stacks-node-api.testnet.stacks.co';
      const response = await fetch(
        `${networkUrl}/extended/v1/contract/call-readonly/${CONTRACT_ADDRESS}/bitreon-core/get-creators-page?args=${encodeURIComponent(JSON.stringify([{ type: 'uint', value: '0' }, { type: 'uint', value: '10' }]))}`
      );
      const data = await response.json();
      return data.result.creators || [];
    },
  });
}
