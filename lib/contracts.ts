import {
  makeContractCall,
  fetchCallReadOnlyFunction,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
  cvToJSON,
  standardPrincipalCV,
} from "@stacks/transactions"
import { getUserData } from "./stacks"

const network = process.env.NODE_ENV === "production" ? "mainnet" : "testnet"
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const CONTRACT_NAME = "bitreon-core"

export interface Creator {
  owner: string
  bnsName: string
  displayName: string
  bio: string
  category: string
  subscriptionPrice: number
  benefits: string
  active: boolean
  createdAt: number
}

export interface Subscription {
  subscriber: string
  creatorId: number
  amountPaid: number
  expiresAt: number
  active: boolean
  createdAt: number
}

// Register as a creator
export async function registerCreator(
  bnsName: string,
  displayName: string,
  bio: string,
  category: string,
  subscriptionPrice: number,
  benefits: string,
) {
  const userData = getUserData()

  if (!userData) {
    throw new Error("User not connected to wallet")
  }

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "register-creator",
    functionArgs: [
      stringAsciiCV(bnsName),
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
      stringUtf8CV(category),
      uintCV(subscriptionPrice),
      stringUtf8CV(benefits),
    ],
    senderKey: userData.profile.stxAddress.testnet,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  }

  const transaction = await makeContractCall(txOptions)
  return await broadcastTransaction(transaction, network)
}

// Subscribe to a creator
export async function subscribeToCreator(creatorId: number, payment: number) {
  const userData = getUserData()

  if (!userData) {
    throw new Error("User not connected to wallet")
  }

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "subscribe-to-creator",
    functionArgs: [uintCV(creatorId), uintCV(payment)],
    senderKey: userData.profile.stxAddress.testnet,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  }

  const transaction = await makeContractCall(txOptions)
  return await broadcastTransaction(transaction, network)
}

// Cancel subscription
export async function cancelSubscription(creatorId: number) {
  const userData = getUserData()

  if (!userData) {
    throw new Error("User not connected to wallet")
  }

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "cancel-subscription",
    functionArgs: [uintCV(creatorId)],
    senderKey: userData.profile.stxAddress.testnet,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  }

  const transaction = await makeContractCall(txOptions)
  return await broadcastTransaction(transaction, network)
}

// Read-only functions

// Check if user is subscribed to creator
export async function isSubscriber(userAddress: string, creatorId: number): Promise<boolean> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-subscriber",
      functionArgs: [standardPrincipalCV(userAddress), uintCV(creatorId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    return cvToJSON(result).value
  } catch (error) {
    console.error("Error checking subscription status:", error)
    return false
  }
}

// Get creator info
export async function getCreator(creatorId: number): Promise<Creator | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-creator",
      functionArgs: [uintCV(creatorId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    const jsonResult = cvToJSON(result)
    if (jsonResult.type === "some") {
      const creator = jsonResult.value
      return {
        owner: creator.owner,
        bnsName: creator["bns-name"],
        displayName: creator["display-name"],
        bio: creator.bio,
        category: creator.category,
        subscriptionPrice: Number.parseInt(creator["subscription-price"]),
        benefits: creator.benefits,
        active: creator.active,
        createdAt: Number.parseInt(creator["created-at"]),
      }
    }
    return null
  } catch (error) {
    console.error("Error getting creator:", error)
    return null
  }
}

// Get creator by BNS name
export async function getCreatorByBNS(bnsName: string): Promise<Creator | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-creator-by-bns",
      functionArgs: [stringAsciiCV(bnsName)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    const jsonResult = cvToJSON(result)
    if (jsonResult.type === "some") {
      const creator = jsonResult.value
      return {
        owner: creator.owner,
        bnsName: creator["bns-name"],
        displayName: creator["display-name"],
        bio: creator.bio,
        category: creator.category,
        subscriptionPrice: Number.parseInt(creator["subscription-price"]),
        benefits: creator.benefits,
        active: creator.active,
        createdAt: Number.parseInt(creator["created-at"]),
      }
    }
    return null
  } catch (error) {
    console.error("Error getting creator by BNS:", error)
    return null
  }
}

// Get creator by owner address
export async function getCreatorByOwner(ownerAddress: string): Promise<Creator | null> {
  try {
    console.log("[v0] Calling getCreatorByOwner with:", { ownerAddress, CONTRACT_ADDRESS, CONTRACT_NAME })

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM") {
      console.warn("[v0] Using fallback contract address - contract may not be deployed")
    }

    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-creator-by-owner",
      functionArgs: [standardPrincipalCV(ownerAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    console.log("[v0] Contract call result:", result)

    const jsonResult = cvToJSON(result)
    console.log("[v0] JSON result:", jsonResult)

    if (jsonResult.type === "some") {
      const creator = jsonResult.value
      return {
        owner: creator.owner,
        bnsName: creator["bns-name"],
        displayName: creator["display-name"],
        bio: creator.bio,
        category: creator.category,
        subscriptionPrice: Number.parseInt(creator["subscription-price"]),
        benefits: creator.benefits,
        active: creator.active,
        createdAt: Number.parseInt(creator["created-at"]),
      }
    }
    return null
  } catch (error) {
    console.error("Error getting creator by owner:", error)
    return null
  }
}

// Get user's subscription to creator
export async function getUserSubscription(userAddress: string, creatorId: number): Promise<Subscription | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-user-subscription",
      functionArgs: [standardPrincipalCV(userAddress), uintCV(creatorId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    })

    const jsonResult = cvToJSON(result)
    if (jsonResult.type === "some") {
      const subscription = jsonResult.value
      return {
        subscriber: subscription.subscriber,
        creatorId: Number.parseInt(subscription["creator-id"]),
        amountPaid: Number.parseInt(subscription["amount-paid"]),
        expiresAt: Number.parseInt(subscription["expires-at"]),
        active: subscription.active,
        createdAt: Number.parseInt(subscription["created-at"]),
      }
    }
    return null
  } catch (error) {
    console.error("Error getting user subscription:", error)
    return null
  }
}

// Network configuration helper
function getNetworkConfig() {
  if (network === "mainnet") {
    return {
      coreApiUrl: "https://api.hiro.so",
      networkId: 1,
    }
  } else {
    return {
      coreApiUrl: "https://api.testnet.hiro.so",
      networkId: 2147483648,
    }
  }
}
