"use client"

import { useState, useEffect } from "react"
import { isUserSignedIn, getUserData } from "@/lib/stacks"
import { isSubscriber, getUserSubscription } from "@/lib/contracts"

export interface SubscriptionStatus {
  isSubscribed: boolean
  isLoading: boolean
  subscription: any | null
  userAddress: string | null
  isSignedIn: boolean
}

export function useSubscription(creatorId: number): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    isLoading: true,
    subscription: null,
    userAddress: null,
    isSignedIn: false,
  })

  useEffect(() => {
    const checkSubscription = async () => {
      const signedIn = isUserSignedIn()

      if (!signedIn) {
        setStatus({
          isSubscribed: false,
          isLoading: false,
          subscription: null,
          userAddress: null,
          isSignedIn: false,
        })
        return
      }

      const userData = getUserData()
      const address = userData.profile?.stxAddress?.testnet || userData.profile?.stxAddress?.mainnet

      if (!address) {
        setStatus({
          isSubscribed: false,
          isLoading: false,
          subscription: null,
          userAddress: null,
          isSignedIn: true,
        })
        return
      }

      try {
        const [subscribed, subscription] = await Promise.all([
          isSubscriber(address, creatorId),
          getUserSubscription(address, creatorId),
        ])

        setStatus({
          isSubscribed: subscribed,
          isLoading: false,
          subscription,
          userAddress: address,
          isSignedIn: true,
        })
      } catch (error) {
        console.error("Error checking subscription:", error)
        setStatus({
          isSubscribed: false,
          isLoading: false,
          subscription: null,
          userAddress: address,
          isSignedIn: true,
        })
      }
    }

    checkSubscription()
  }, [creatorId])

  return status
}
