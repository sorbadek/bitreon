import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { bnsName: string } }) {
  try {
    const supabase = await createClient()

    const { data: creator, error } = await supabase
      .from("creators")
      .select(`
        *,
        posts (
          id,
          title,
          content,
          is_premium,
          created_at
        ),
        subscriptions (
          id,
          subscriber_wallet,
          amount_btc,
          expires_at,
          created_at
        )
      `)
      .eq("bns_name", params.bnsName)
      .single()

    if (error) {
      console.error("[v0] Error fetching creator:", error)
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    return NextResponse.json({ creator })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
