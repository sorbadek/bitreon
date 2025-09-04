"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, Lock, Star, Bitcoin } from "lucide-react"
import { isUserSignedIn, getUserData } from "@/lib/stacks"
import { isSubscriber } from "@/lib/contracts"
import Link from "next/link"

interface ContentGateProps {
  creatorId: number
  creatorName: string
  creatorBnsName: string
  subscriptionPrice: number
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function ContentGate({
  creatorId,
  creatorName,
  creatorBnsName,
  subscriptionPrice,
  children,
  fallback,
  className = "",
}: ContentGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      const signedIn = isUserSignedIn()
      setIsSignedIn(signedIn)

      if (!signedIn) {
        setHasAccess(false)
        return
      }

      const userData = getUserData()
      const address = userData.profile?.stxAddress?.testnet || userData.profile?.stxAddress?.mainnet
      setUserAddress(address)

      if (address) {
        try {
          const subscribed = await isSubscriber(address, creatorId)
          setHasAccess(subscribed)
        } catch (error) {
          console.error("Error checking subscription:", error)
          setHasAccess(false)
        }
      } else {
        setHasAccess(false)
      }
    }

    checkAccess()
  }, [creatorId])

  if (hasAccess === null) {
    return (
      <div className={`animate-pulse ${className}`}>
        <Card>
          <CardHeader>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>
  }

  // Show fallback or default locked content
  return (
    <div className={className}>
      {fallback || (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Premium Content
            </CardTitle>
            <CardDescription>This content is exclusive to subscribers of {creatorName}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Bitcoin className="w-4 h-4" />
                <span className="font-medium">{subscriptionPrice} sBTC/week</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Subscribe to unlock exclusive content and get your NFT badge
              </p>
            </div>

            {!isSignedIn ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>Please connect your wallet to subscribe and access premium content.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Star className="w-3 h-3 mr-1" />
                  Subscriber Benefits Available
                </Badge>
                <Button className="w-full stacks-gradient text-white border-0" asChild>
                  <Link href={`/creator/${creatorBnsName}`}>Subscribe to {creatorName}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
