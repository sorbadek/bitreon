"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Clock, Eye } from "lucide-react"
import Link from "next/link"

interface PremiumContentPreviewProps {
  title: string
  excerpt: string
  readTime: string
  views?: number
  publishedAt: string
  creatorBnsName: string
  postId: string
  isSubscribed: boolean
}

export function PremiumContentPreview({
  title,
  excerpt,
  readTime,
  views,
  publishedAt,
  creatorBnsName,
  postId,
  isSubscribed,
}: PremiumContentPreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${!isSubscribed ? "border-dashed border-2" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {title}
              {!isSubscribed && <Lock className="w-4 h-4 text-muted-foreground" />}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{readTime}</span>
              <span>•</span>
              <span>{formatDate(publishedAt)}</span>
              {views && (
                <>
                  <span>•</span>
                  <Eye className="w-3 h-3" />
                  <span>{views}</span>
                </>
              )}
            </div>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>{isSubscribed ? "Unlocked" : "Premium"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 line-clamp-2">{excerpt}</CardDescription>

        <Button variant={isSubscribed ? "default" : "outline"} className="w-full" asChild>
          <Link href={`/creator/${creatorBnsName}/content/${postId}`}>
            {isSubscribed ? "Read Article" : "Subscribe to Unlock"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
