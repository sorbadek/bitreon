"use client"

import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"

interface SubscriberBadgeProps {
  creatorId: number
  className?: string
}

export function SubscriberBadge({ creatorId, className = "" }: SubscriberBadgeProps) {
  const { isSubscribed, isLoading } = useSubscription(creatorId)

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-20 bg-muted rounded"></div>
      </div>
    )
  }

  if (!isSubscribed) {
    return null
  }

  return (
    <Badge className={`bg-green-100 text-green-800 border-green-200 ${className}`}>
      <Shield className="w-3 h-3 mr-1" />
      Subscriber
    </Badge>
  )
}
