export interface PaymentLink {
  id: string
  amount: number
  currency: "BTC" | "USD"
  description: string
  creatorId: number
  expiresAt: number
  url: string
}

export interface MerchantStats {
  totalRevenue: number
  monthlyRevenue: number
  totalSubscribers: number
  activeSubscribers: number
  conversionRate: number
  averageSubscriptionValue: number
}

// Create payment link
export async function createPaymentLink(
  creatorId: number,
  amount: number,
  currency: "BTC" | "USD" = "BTC",
  description: string,
  expiresIn: number = 24 * 60 * 60 * 1000, // 24 hours
): Promise<PaymentLink> {
  const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const paymentLink: PaymentLink = {
    id: linkId,
    amount,
    currency,
    description,
    creatorId,
    expiresAt: Date.now() + expiresIn,
    url: `${window.location.origin}/pay/${linkId}`,
  }

  // In real implementation, store in database
  localStorage.setItem(`payment_link_${linkId}`, JSON.stringify(paymentLink))

  return paymentLink
}

// Get BTC to USD conversion rate
export async function getBTCPrice(): Promise<number> {
  try {
    const response = await fetch("/api/btc-price")
    const data = await response.json()
    return data.price
  } catch (error) {
    console.error("Error fetching BTC price:", error)
    return 45000 // Fallback price
  }
}

// Convert USD to BTC
export async function convertUSDToBTC(usdAmount: number): Promise<number> {
  const btcPrice = await getBTCPrice()
  return usdAmount / btcPrice
}

// Convert BTC to USD
export async function convertBTCToUSD(btcAmount: number): Promise<number> {
  const btcPrice = await getBTCPrice()
  return btcAmount * btcPrice
}

// Get merchant dashboard stats
export async function getMerchantStats(creatorId: number): Promise<MerchantStats> {
  try {
    const response = await fetch(`/api/subscriptions?creatorId=${creatorId}`)
    const data = await response.json()

    // Calculate stats from subscription data
    const stats: MerchantStats = {
      totalRevenue: 1.25, // Mock data - would be calculated from actual payments
      monthlyRevenue: 0.45,
      totalSubscribers: 1250,
      activeSubscribers: 1100,
      conversionRate: 0.12, // 12% conversion rate
      averageSubscriptionValue: 0.001,
    }

    return stats
  } catch (error) {
    console.error("Error fetching merchant stats:", error)
    throw error
  }
}

// Process subscription with auto-renewal
export async function createSubscriptionWithRenewal(
  creatorId: number,
  subscriberId: string,
  tier = "basic",
  autoRenew = false,
) {
  try {
    const response = await fetch("/api/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        creatorId,
        subscriberId,
        tier,
        autoRenew,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create subscription")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating subscription:", error)
    throw error
  }
}

// Handle subscription tiers
export interface SubscriptionTier {
  id: string
  name: string
  price: number
  currency: "BTC" | "USD"
  features: string[]
  duration: number // in days
}

export const defaultSubscriptionTiers: SubscriptionTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: 0.001,
    currency: "BTC",
    features: ["Access to basic content", "NFT subscriber badge"],
    duration: 7,
  },
  {
    id: "premium",
    name: "Premium",
    price: 0.005,
    currency: "BTC",
    features: ["Access to all content", "Premium NFT badge", "Direct messaging", "Early access"],
    duration: 30,
  },
  {
    id: "vip",
    name: "VIP",
    price: 0.01,
    currency: "BTC",
    features: ["All premium features", "1-on-1 video calls", "Custom NFT", "Exclusive events"],
    duration: 30,
  },
]
