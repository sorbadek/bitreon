import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network"
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions"

// Initialize the network
const network = process.env.NODE_ENV === 'production' ? STACKS_TESTNET : STACKS_TESTNET
const SBTC_CONTRACT_ADDRESS = "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR"
const SBTC_CONTRACT_NAME = "Wrapped-Bitcoin"

export interface SBTCTransaction {
  txId: string
  amount: number
  from: string
  to: string
  status: "pending" | "confirmed" | "failed"
  timestamp: number
}

// Convert BTC amount to satoshis
export function btcToSatoshis(btc: number): number {
  return Math.floor(btc * 100000000)
}

// Convert satoshis to BTC
export function satoshisToBTC(satoshis: number): number {
  return satoshis / 100000000
}

// Format BTC amount for display
export function formatBTC(amount: number): string {
  return `${amount.toFixed(8)} BTC`
}

// Real sBTC payment using Stacks network
export async function sendSBTCPayment(
  recipientAddress: string,
  amountSats: number,
  memo?: string,
  senderKey?: string,
): Promise<SBTCTransaction> {
  try {
    const transaction = await makeContractCall({
      contractAddress: SBTC_CONTRACT_ADDRESS,
      contractName: SBTC_CONTRACT_NAME,
      functionName: "transfer",
      functionArgs: [
        uintCV(amountSats),
        principalCV(recipientAddress),
        memo ? uintCV(Buffer.from(memo).toString("hex")) : uintCV(0),
      ],
      senderKey: senderKey || "",
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    })
    
    const broadcastResponse = await broadcastTransaction(transaction)

    return {
      txId: broadcastResponse.txid,
      amount: satoshisToBTC(amountSats),
      from: "sender_address", // Would be derived from senderKey
      to: recipientAddress,
      status: "pending",
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("[v0] sBTC payment error:", error)
    throw new Error(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Get real sBTC balance from contract
export async function getSBTCBalance(address: string): Promise<number> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: SBTC_CONTRACT_ADDRESS,
      contractName: SBTC_CONTRACT_NAME,
      functionName: 'get-balance',
      functionArgs: [principalCV(address)],
      senderAddress: address,
      network,
    })
    const jsonResult = cvToJSON(result)
    const balanceSats = jsonResult.value?.value || 0
    return satoshisToBTC(balanceSats)
  } catch (error) {
    console.error("[v0] Error getting sBTC balance:", error)
    return 0
  }
}

// Real transaction fee estimation
export function estimateTransactionFee(amount: number): number {
  // Base fee for Stacks transactions (in BTC)
  const baseFee = 0.00001 // 1000 satoshis
  const percentageFee = amount * 0.0001 // 0.01% of amount
  return Math.max(baseFee, percentageFee)
}

// Check transaction status
export async function getTransactionStatus(txId: string): Promise<string> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://stacks-node-api.testnet.stacks.co'
    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction status: ${response.statusText}`)
    }
    
    const txData = await response.json()

    if (txData.tx_status === "success") {
      return "confirmed"
    } else if (txData.tx_status === "abort_by_response" || 
               txData.tx_status === "abort_by_post_condition" ||
               txData.tx_status === "aborted") {
      return "failed"
    } else {
      return "pending"
    }
  } catch (error) {
    console.error("[v0] Error checking transaction status:", error)
    return "pending"
  }
}
