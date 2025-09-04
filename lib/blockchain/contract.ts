import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { network, CONTRACT_ADDRESS } from './client';

export async function callContractReadOnly(
  functionName: string,
  args: any[] = [],
  callerAddress = CONTRACT_ADDRESS
) {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: 'bitreon-core',
      functionName,
      functionArgs: args,
      network,
      senderAddress: callerAddress,
    });
    return cvToJSON(result);
  } catch (error) {
    console.error('Error calling contract:', error);
    throw error;
  }
}

export async function getCreator(creatorId: number) {
  const result = await callContractReadOnly('get-creator', [
    { type: 'uint', value: creatorId.toString() },
  ]);
  return result.value;
}

export async function getCreatorsPage(offset: number, limit: number) {
  const result = await callContractReadOnly('get-creators-page', [
    { type: 'uint', value: offset.toString() },
    { type: 'uint', value: limit.toString() },
  ]);
  return result.value;
}

export async function isSubscribed(userAddress: string, creatorId: number) {
  const result = await callContractReadOnly('is-subscriber', [
    { type: 'principal', value: userAddress },
    { type: 'uint', value: creatorId.toString() },
  ], userAddress);
  return result.value;
}

export async function getSubscription(subscriptionId: number) {
  const result = await callContractReadOnly('get-subscription', [
    { type: 'uint', value: subscriptionId.toString() },
  ]);
  return result.value;
}
