import { type NextRequest, NextResponse } from "next/server"
import { fetchCallReadOnlyFunction, uintCV } from "@stacks/transactions"
import { STACKS_TESTNET } from '@stacks/network';

// Stacks network configuration
const network = STACKS_TESTNET;
if (process.env.NEXT_PUBLIC_STACKS_API_URL) {
  // @ts-ignore - coreApiUrl exists on the network instance
  network.coreApiUrl = process.env.NEXT_PUBLIC_STACKS_API_URL;
}
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''
const CONTRACT_NAME = 'bitreon-core'

// Type definitions for creator data
interface CreatorData {
  bns_name: string
  display_name: string
  bio: string
  category: string
  subscription_price: number | string
  benefits: string[]
  owner: string
}

// Helper function to validate creator data
function validateCreatorData(data: any): { isValid: boolean; errors: string[]; validData: Partial<CreatorData> } {
  const errors: string[] = []
  const validData: Partial<CreatorData> = { ...data }

  // Handle wallet_address as an alias for owner for backward compatibility
  if (data.wallet_address && !data.owner) {
    validData.owner = data.wallet_address
  } else if (!data.owner) {
    errors.push('owner (or wallet_address) is required')
  }

  // Required fields
  const requiredFields: Array<keyof CreatorData> = [
    'bns_name',
    'display_name',
    'subscription_price',
    'owner'
  ]

  // Check required fields (except owner which is handled separately)
  for (const field of requiredFields.filter(f => f !== 'owner')) {
    if (!data[field] && data[field] !== 0) {
      errors.push(`${field} is required`)
    }
  }

  // Handle both subscription_price and subscription_price_btc for backward compatibility
  const priceValue = data.subscription_price || data.subscription_price_btc
  if (priceValue !== undefined) {
    const price = typeof priceValue === 'string' ? parseFloat(priceValue) : Number(priceValue)
    if (isNaN(price) || price <= 0) {
      errors.push('Subscription price must be a positive number')
    } else {
      validData.subscription_price = price
    }
  } else {
    errors.push('subscription_price is required')
  }

  // Ensure benefits is an array
  if (data.benefits && !Array.isArray(data.benefits)) {
    validData.benefits = [String(data.benefits)]
  } else if (!data.benefits) {
    validData.benefits = []
  }

  return {
    isValid: errors.length === 0,
    errors,
    validData: validData as CreatorData
  }
}

export async function GET() {
  try {
    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: "Contract address not configured" },
        { status: 500 }
      )
    }

    // Call the get-creators-page function from the contract
    let creatorsResponse
    try {
      creatorsResponse = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-creators-page",
        functionArgs: [uintCV(0), uintCV(100)], // Start from 0, get up to 100 creators
        senderAddress: CONTRACT_ADDRESS,
        network
      })
    } catch (error) {
      console.error("Error calling smart contract:", error)
      throw new Error("Failed to fetch creators from blockchain")
    }

    // Process the response from the blockchain
    const creators = (creatorsResponse as any)?.value?.list?.map((creatorCV: any) => {
      try {
        const creator = creatorCV?.value
        if (!creator) return null

        return {
          id: creator['creator-id']?.value,
          bns_name: creator['bns-name']?.value,
          display_name: creator['display-name']?.value,
          bio: creator.bio?.value,
          category: creator.category?.value,
          subscription_price: creator['subscription-price']?.value,
          benefits: creator.benefits?.value?.map((b: any) => b?.value) || [],
          owner: creator.owner?.value,
          active: creator.active?.value,
          created_at: creator['created-at']?.value
        }
      } catch (error) {
        console.error("Error processing creator:", error)
        return null
      }
    }).filter(Boolean) // Remove any null entries from failed processing

    return NextResponse.json({ creators: creators || [] })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch creators",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: any
    try {
      body = await request.json()
      console.log('Received request body:', JSON.stringify(body, null, 2))
    } catch (e) {
      console.error('Error parsing JSON:', e)
      return NextResponse.json(
        { 
          error: 'Invalid JSON payload',
          details: e instanceof Error ? e.message : 'Unknown error parsing JSON'
        },
        { status: 400 }
      )
    }

    // Validate creator data
    console.log('Validating creator data...')
    const { isValid, errors, validData } = validateCreatorData(body)
    console.log('Validation result:', { isValid, errors, validData })
    
    if (!isValid) {
      const errorResponse = { 
        error: 'Validation failed',
        details: errors,
        receivedData: {
          bns_name: body.bns_name,
          display_name: body.display_name,
          subscription_price: body.subscription_price,
          owner: body.owner || body.wallet_address,
          has_benefits: Boolean(body.benefits)
        }
      }
      console.error('Validation failed:', errorResponse)
      return NextResponse.json(errorResponse, { status: 400 })
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: "Contract address not configured" },
        { status: 500 }
      )
    }

    // In a real implementation, you would:
    // 1. Create a transaction to register the creator on-chain
    // 2. Wait for the transaction to be confirmed
    // 3. Return the transaction ID to the client

    // For now, we'll return a success response with the validated data
    // The actual blockchain interaction will be handled by the frontend
    return NextResponse.json(
      { 
        success: true,
        message: 'Creator registration data validated successfully',
        // The frontend should handle the actual blockchain transaction
        data: {
          bns_name: validData.bns_name,
          display_name: validData.display_name,
          bio: validData.bio || '',
          category: validData.category || '',
          subscription_price: validData.subscription_price,
          benefits: validData.benefits || [],
          owner: validData.owner
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
