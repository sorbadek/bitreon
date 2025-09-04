import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In real implementation, fetch from multiple price feeds
    // CoinGecko, CoinMarketCap, Binance, etc.
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", {
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      throw new Error("Failed to fetch BTC price")
    }

    const data = await response.json()
    const btcPrice = data.bitcoin.usd

    return NextResponse.json({
      price: btcPrice,
      currency: "USD",
      timestamp: Date.now(),
      source: "coingecko",
    })
  } catch (error) {
    console.error("Error fetching BTC price:", error)

    // Fallback price if API fails
    return NextResponse.json({
      price: 45000, // Fallback price
      currency: "USD",
      timestamp: Date.now(),
      source: "fallback",
      error: "Live price unavailable",
    })
  }
}
