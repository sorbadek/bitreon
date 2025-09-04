"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bitcoin, CreditCard, Zap, Shield, Clock } from "lucide-react"
import { getBTCPrice, defaultSubscriptionTiers } from "@/lib/payment-integration"
import { formatBTC } from "@/lib/sbTC"

interface PaymentWidgetProps {
  creatorId: number
  creatorName: string
  onPayment: (tier: string, amount: number, autoRenew: boolean) => void
}

export function PaymentWidget({ creatorId, creatorName, onPayment }: PaymentWidgetProps) {
  const [selectedTier, setSelectedTier] = useState("basic")
  const [currency, setCurrency] = useState<"BTC" | "USD">("BTC")
  const [autoRenew, setAutoRenew] = useState(false)
  const [btcPrice, setBtcPrice] = useState(45000)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchBTCPrice = async () => {
      try {
        const price = await getBTCPrice()
        setBtcPrice(price)
      } catch (error) {
        console.error("Error fetching BTC price:", error)
      }
    }

    fetchBTCPrice()
    const interval = setInterval(fetchBTCPrice, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const selectedTierData = defaultSubscriptionTiers.find((tier) => tier.id === selectedTier)
  if (!selectedTierData) return null

  const displayPrice = currency === "USD" ? selectedTierData.price * btcPrice : selectedTierData.price

  const handlePayment = async () => {
    if (!selectedTierData) return

    setIsLoading(true)
    try {
      await onPayment(selectedTier, selectedTierData.price, autoRenew)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bitcoin className="w-5 h-5" />
          Subscribe to {creatorName}
        </CardTitle>
        <CardDescription>Choose your subscription tier and payment preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier Selection */}
        <div className="space-y-3">
          <Label>Subscription Tier</Label>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {defaultSubscriptionTiers.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{tier.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {formatBTC(tier.price)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currency Toggle */}
        <div className="space-y-3">
          <Label>Display Currency</Label>
          <div className="flex items-center gap-4">
            <Button
              variant={currency === "BTC" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrency("BTC")}
              className="flex-1"
            >
              <Bitcoin className="w-4 h-4 mr-2" />
              BTC
            </Button>
            <Button
              variant={currency === "USD" ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrency("USD")}
              className="flex-1"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              USD
            </Button>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{selectedTierData.name} Subscription</span>
            <span className="text-lg font-bold">
              {currency === "USD" ? `$${displayPrice.toFixed(2)}` : formatBTC(displayPrice)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Duration: {selectedTierData.duration} days</div>
          {currency === "USD" && (
            <div className="text-xs text-muted-foreground mt-1">
              ≈ {formatBTC(selectedTierData.price)} (${btcPrice.toLocaleString()}/BTC)
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>Included Features</Label>
          <ul className="text-sm text-muted-foreground space-y-1">
            {selectedTierData.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Auto-renewal */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-renew">Auto-renewal</Label>
            <p className="text-xs text-muted-foreground">Automatically renew when subscription expires</p>
          </div>
          <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full stacks-gradient text-white border-0"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Subscribe Now
            </>
          )}
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Instant activation after payment confirmation
          </p>
          <p>Secure payments powered by Bitcoin & Stacks</p>
        </div>
      </CardContent>
    </Card>
  )
}
