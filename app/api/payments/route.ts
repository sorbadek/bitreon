import { type NextRequest, NextResponse } from "next/server"
import { sendSBTCPayment, btcToSatoshis } from "@/lib/sbTC"

export async function POST(request: NextRequest) {
  try {
    const { recipientAddress, amount, memo, creatorId, subscriberId } = await request.json()

    // Validate required fields
    if (!recipientAddress || !amount) {
      return NextResponse.json({ error: "Missing required fields: recipientAddress, amount" }, { status: 400 })
    }

    // Process sBTC payment
    const payment = await sendSBTCPayment(recipientAddress, btcToSatoshis(amount), memo)

    // In a real implementation, you would:
    // 1. Store payment record in database
    // 2. Update subscription status
    // 3. Trigger webhook notifications
    // 4. Handle payment confirmations

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.txId,
        status: payment.status,
        amount: amount,
        recipient: recipientAddress,
        timestamp: payment.timestamp,
      },
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get("id")
  const userId = searchParams.get("userId")

  try {
    if (paymentId) {
      // Get specific payment by ID
      // In real implementation, query database
      return NextResponse.json({
        id: paymentId,
        status: "confirmed",
        amount: 0.001,
        timestamp: Date.now(),
      })
    }

    if (userId) {
      // Get user's payment history
      // In real implementation, query database
      return NextResponse.json({
        payments: [
          {
            id: "payment_1",
            amount: 0.001,
            status: "confirmed",
            creatorName: "Digital Artist",
            timestamp: Date.now() - 86400000,
          },
        ],
        total: 1,
      })
    }

    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}
