"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bitcoin, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { subscribeToCreator } from "@/lib/contracts"
import { sendSBTCPayment, btcToSatoshis, formatBTC, estimateTransactionFee } from "@/lib/sbTC"

interface Creator {
  id: number
  displayName: string
  bnsName: string
  subscriptionPrice: number
}

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  creator: Creator
  onSuccess: () => void
}

export function SubscriptionModal({ isOpen, onClose, creator, onSuccess }: SubscriptionModalProps) {
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm")
  const [error, setError] = useState<string | null>(null)

  const subscriptionFee = estimateTransactionFee(creator.subscriptionPrice)
  const totalAmount = creator.subscriptionPrice + subscriptionFee

  const handleSubscribe = async () => {
    try {
      setStep("processing")
      setError(null)

      // Step 1: Send sBTC payment
      const payment = await sendSBTCPayment(
        "creator_wallet_address", // In real app, this would be the creator's address
        btcToSatoshis(creator.subscriptionPrice),
        `Subscription to ${creator.bnsName}.btc`,
      )

      // Step 2: Call smart contract to register subscription
      const contractResult = await subscribeToCreator(creator.id, btcToSatoshis(creator.subscriptionPrice))

      console.log("Subscription successful:", { payment, contractResult })
      setStep("success")

      // Auto-close and trigger success callback after 2 seconds
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err) {
      console.error("Subscription failed:", err)
      setError(err instanceof Error ? err.message : "Subscription failed")
      setStep("error")
    }
  }

  const handleClose = () => {
    if (step !== "processing") {
      onClose()
      setStep("confirm")
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5" />
            Subscribe to {creator.displayName}
          </DialogTitle>
          <DialogDescription>Support {creator.displayName} and get exclusive access to their content</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "confirm" && (
            <>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span>Subscription (1 week)</span>
                  <span className="font-medium">{formatBTC(creator.subscriptionPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Network fee</span>
                  <span>{formatBTC(subscriptionFee)}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatBTC(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  You'll receive:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>• Exclusive NFT subscriber badge</li>
                  <li>• Access to premium content</li>
                  <li>• 1 week of subscription benefits</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will automatically expire after 1 week. You can renew anytime.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleSubscribe} className="flex-1 stacks-gradient text-white border-0">
                  Subscribe Now
                </Button>
              </div>
            </>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <h3 className="font-medium mb-2">Processing Subscription</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your payment and mint your NFT badge...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Subscription Successful!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your NFT badge has been minted and you now have access to exclusive content.
              </p>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Shield className="w-3 h-3 mr-1" />
                Subscriber Badge Earned
              </Badge>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Subscription Failed</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Close
                </Button>
                <Button onClick={() => setStep("confirm")} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
