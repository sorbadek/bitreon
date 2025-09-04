import {
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
  stringAsciiCV,
  uintCV,
  principalCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
  someCV,
  noneCV,
  ClarityValue
} from "@stacks/transactions"
import { openContractCall } from "@stacks/connect"
import { STACKS_TESTNET } from '@stacks/network';

const network = STACKS_TESTNET;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "ST2S5RQ13X74V6D2GX9QRX7K89QMB2XTFJWFATZ6Y"
const CONTRACT_NAME = "bitreon-core"

export interface StacksTransaction {
  txId: string
  status: "pending" | "confirmed" | "failed"
  blockHeight?: number
}

export async function subscribeToCreator(
  creatorAddress: string,
  amountSats: number,
  userAddress: string,
): Promise<string | null> {
  try {
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "subscribe-to-creator",
      functionArgs: [principalCV(creatorAddress), uintCV(amountSats), stringUtf8CV("subscription")],
      senderKey: "",
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: async (data: any) => {
        console.log("[v0] Subscription transaction submitted:", data.txId)
      },
      onCancel: () => {
        console.log("[v0] Transaction cancelled")
      },
    }

    await openContractCall(txOptions)
    return "pending"
  } catch (error) {
    console.error("[v0] Error subscribing to creator:", error)
    return null
  }
}

export async function checkSubscriptionStatus(userAddress: string, creatorAddress: string): Promise<boolean> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-subscription-status",
      functionArgs: [principalCV(userAddress), principalCV(creatorAddress)],
      senderAddress: userAddress,
      network,
    });

    const jsonResult = cvToJSON(result)
    return jsonResult.value?.value === true
  } catch (error) {
    console.error("[v0] Error checking subscription status:", error)
    return false
  }
}

export async function getCreatorFromContract(creatorAddress: string): Promise<any> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-creator-by-owner",
      functionArgs: [principalCV(creatorAddress)],
      senderAddress: creatorAddress,
      network,
    });

    return cvToJSON(result)
  } catch (error) {
    console.error("[v0] Error getting creator from contract:", error)
    return null
  }
}

export async function registerCreatorOnContract(
  bnsName: string,
  displayName: string,
  bio: string,
  category: string,
  subscriptionPrice: number, // in microSTX
  benefits: string,
  metadata?: string
): Promise<boolean> {
  try {
    // Convert benefits to a single string if it's an array
    const benefitsString = Array.isArray(benefits) ? benefits.join('\n') : benefits
    
    const functionArgs: ClarityValue[] = [
      stringAsciiCV(bnsName),
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
      stringUtf8CV(category),
      uintCV(subscriptionPrice),
      stringUtf8CV(benefitsString)
    ]

    // Add metadata if provided
    if (metadata) {
      functionArgs.push(someCV(stringUtf8CV(metadata)))
    } else {
      functionArgs.push(noneCV())
    }

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "register-creator",
      functionArgs,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data: any) => {
        console.log("[v0] Creator registration transaction:", data.txId)
      },
      onCancel: () => {
        console.log("[v0] Transaction cancelled")
      }
    })
    return true
  } catch (error) {
    console.error("[v0] Error registering creator:", error)
    return false
  }
}

export async function checkBNSAvailability(name: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.hiro.so/v1/names/${name}.btc`)
    // If name exists, it's not available
    return response.status === 404
  } catch (error) {
    console.error("[v0] Error checking BNS availability:", error)
    return false
  }
}

export async function getCreatorByBNS(bnsName: string): Promise<any> {
  try {
    // Get all creators from contract and find by BNS name
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-creators-page",
      functionArgs: [uintCV(0), uintCV(100)], // Get first 100 creators
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    const creators = cvToJSON(result)
    const creator = creators.value?.find((c: any) => c.value.bns_name?.value === bnsName)

    return creator ? creator.value : null
  } catch (error) {
    console.error("[v0] Error getting creator by BNS:", error)
    return null
  }
}

export async function getUserSubscriptionStatus(
  userAddress: string,
  creatorAddress: string,
): Promise<{
  isSubscribed: boolean
  expiresAt?: string
  tier?: string
}> {
  try {
    const contractStatus = await checkSubscriptionStatus(userAddress, creatorAddress)

    // Get subscription details from contract
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-subscription-details",
      functionArgs: [principalCV(userAddress), principalCV(creatorAddress)],
      network,
      senderAddress: userAddress,
    })

    const details = cvToJSON(result)

    return {
      isSubscribed: contractStatus,
      expiresAt: details.value?.expires_at?.value,
      tier: details.value?.tier?.value || "basic",
    }
  } catch (error) {
    console.error("[v0] Error checking subscription status:", error)
    return { isSubscribed: false }
  }
}

export async function getCreatorContent(creatorId: string, userAddress?: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/creators/${creatorId}/content`, {
      headers: userAddress ? { "X-User-Address": userAddress } : {},
    })

    if (!response.ok) {
      throw new Error("Failed to fetch content")
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Error fetching creator content:", error)
    return []
  }
}

export async function getAllCreators(): Promise<any[]> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-creators-page",
      functionArgs: [uintCV(0), uintCV(100)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    const creators = cvToJSON(result)
    return creators.value || []
  } catch (error) {
    console.error("[v0] Error getting all creators:", error)
    return []
  }
}
