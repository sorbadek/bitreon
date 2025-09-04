"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Check, AlertCircle, Bitcoin } from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { checkBNSAvailability, registerCreatorOnContract } from "@/lib/stacks-integration"
import { isUserSignedIn, getUserAddress } from "@/lib/stacks"

export default function CreatorRegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    bnsName: "",
    displayName: "",
    bio: "",
    category: "",
    subscriptionPrice: "",
    benefits: "",
    metadata: ""
  })
  const [isCheckingBNS, setIsCheckingBNS] = useState(false)
  const [bnsAvailable, setBnsAvailable] = useState<boolean | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const checkBNSAvailabilityReal = async () => {
    if (!formData.bnsName) return

    setIsCheckingBNS(true)
    try {
      const available = await checkBNSAvailability(formData.bnsName)
      setBnsAvailable(available)
    } catch (error) {
      console.error("[v0] Error checking BNS availability:", error)
      setBnsAvailable(false)
    } finally {
      setIsCheckingBNS(false)
    }
  }

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!isUserSignedIn()) {
      alert("Please connect your wallet first")
      return
    }

    setIsRegistering(true)
    try {
      const userAddress = getUserAddress()
      const subscriptionPriceInMicroSTX = Math.floor(Number(formData.subscriptionPrice) * 1000000) // Convert to microSTX

      // Register on smart contract first
      const contractResult = await registerCreatorOnContract(
        formData.bnsName,
        formData.displayName,
        formData.bio,
        formData.category,
        subscriptionPriceInMicroSTX,
        formData.benefits,
        formData.metadata || undefined
      )

      if (!contractResult) {
        throw new Error("Smart contract registration failed")
      }

      // Then register in database
      const response = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bns_name: formData.bnsName,
          display_name: formData.displayName,
          bio: formData.bio,
          category: formData.category,
          subscription_price: subscriptionPriceInMicroSTX,
          benefits: formData.benefits,
          wallet_address: userAddress,
          metadata: formData.metadata || undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(errorData.error || "Failed to register creator in database")
      }

      alert("Creator registration successful! Your profile is now live.")
      window.location.href = `/creator/${formData.bnsName}`
    } catch (error) {
      console.error("[v0] Registration error:", error)
      alert(`Registration failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bitcoin-gradient rounded-lg flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Bitreon</h1>
          </Link>
          <WalletConnect />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Become a Creator</h1>
          <p className="text-muted-foreground">Set up your creator profile and start earning Bitcoin</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNum < step ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              {stepNum < 3 && <div className={`w-16 h-0.5 mx-2 ${stepNum < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "BNS Identity"}
              {step === 2 && "Creator Profile"}
              {step === 3 && "Subscription Setup"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Claim your .btc name for verified identity"}
              {step === 2 && "Tell your audience about yourself"}
              {step === 3 && "Set your subscription tier and benefits"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: BNS Registration */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="btcName">Choose your .btc name</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        id="bnsName"
                        placeholder="yourname"
                        value={formData.bnsName}
                        onChange={(e) => handleInputChange("bnsName", e.target.value)}
                        className="pr-12"
                        maxLength={48}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">.btc</span>
                    </div>
                    <Button
                      onClick={checkBNSAvailabilityReal}
                      disabled={!formData.bnsName || isCheckingBNS}
                      variant="outline"
                    >
                      {isCheckingBNS ? "Checking..." : "Check"}
                    </Button>
                  </div>
                </div>

                {bnsAvailable !== null && (
                  <Alert className={bnsAvailable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertCircle className={`h-4 w-4 ${bnsAvailable ? "text-green-600" : "text-red-600"}`} />
                    <AlertDescription className={bnsAvailable ? "text-green-800" : "text-red-800"}>
                      {bnsAvailable
                        ? `${formData.bnsName}.btc is available!`
                        : `${formData.bnsName}.btc is already taken. Try another name.`}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4">
                  <Button onClick={handleNextStep} disabled={!bnsAvailable} className="w-full">
                    Continue with {formData.bnsName}.btc
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Creator Profile */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your creator name"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell your audience about yourself and your content..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Art, Music, Education"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="benefits">Subscriber Benefits</Label>
                  <Textarea
                    id="benefits"
                    placeholder="Describe the benefits subscribers will receive..."
                    value={formData.benefits}
                    onChange={(e) => handleInputChange("benefits", e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.benefits.length}/2000 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="metadata">Additional Metadata (Optional)</Label>
                  <Textarea
                    id="metadata"
                    placeholder="Any additional information about your creator profile..."
                    value={formData.metadata}
                    onChange={(e) => handleInputChange("metadata", e.target.value)}
                    rows={2}
                    maxLength={1024}
                    className="min-h-[80px]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.metadata.length}/1024 characters
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevStep}>
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!formData.displayName || !formData.bio || !formData.category || !formData.benefits}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Subscription Setup */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subscriptionPrice">Weekly Subscription Price (sBTC)</Label>
                  <div className="relative">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="number"
                          id="subscriptionPrice"
                          placeholder="0.001"
                          value={formData.subscriptionPrice}
                          onChange={(e) => handleInputChange("subscriptionPrice", e.target.value)}
                          min="0.001"
                          step="0.001"
                          className="max-w-[200px] pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₿</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Minimum: 0.001 BTC (~${0.001 * 50000}) per month
                      </p>
                    </div>
                  </div>
                  <Textarea
                    id="benefits"
                    placeholder="What do subscribers get? Exclusive content, early access, community perks..."
                    value={formData.benefits}
                    onChange={(e) => handleInputChange("benefits", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Your Creator Profile Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{formData.bnsName}.btc</Badge>
                      <span className="text-muted-foreground">•</span>
                      <span>{formData.category}</span>
                    </div>
                    <p className="font-medium">{formData.displayName}</p>
                    <p className="text-muted-foreground">{formData.bio}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Bitcoin className="w-4 h-4" />
                      <span className="font-medium">{formData.subscriptionPrice} sBTC/week</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handlePrevStep} className="flex-1 bg-transparent">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.subscriptionPrice || !formData.benefits || isRegistering}
                    className="flex-1 stacks-gradient text-white border-0"
                  >
                    {isRegistering ? "Registering..." : "Register as Creator"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
