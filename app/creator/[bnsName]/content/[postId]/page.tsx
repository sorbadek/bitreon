"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Clock, Heart, MessageCircle, Share, Bitcoin } from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { ContentGate } from "@/components/content-gate"

// Mock data - in real app, this would come from smart contracts or database
const mockPost = {
  id: 1,
  title: "Advanced Digital Art Techniques: Creating Depth with Light",
  content: `
    <h2>Understanding Light in Digital Art</h2>
    <p>Light is one of the most crucial elements in creating compelling digital artwork. In this exclusive tutorial, I'll walk you through my process for creating realistic lighting effects that add depth and dimension to your pieces.</p>
    
    <h3>Key Techniques We'll Cover:</h3>
    <ul>
      <li>Ambient occlusion and how it affects your shadows</li>
      <li>Creating realistic rim lighting</li>
      <li>Color temperature and mood setting</li>
      <li>Advanced blending modes for light effects</li>
    </ul>
    
    <p>This technique has been fundamental in my latest NFT collection, and I'm excited to share it exclusively with my subscribers.</p>
    
    <h3>Step-by-Step Process</h3>
    <p>First, we'll start with understanding the basic principles of light behavior. Light doesn't just illuminate objects - it interacts with surfaces, bounces, and creates complex relationships between different elements in your composition.</p>
    
    <p>The key is to observe how light behaves in the real world and then translate those observations into your digital medium. Pay attention to:</p>
    <ul>
      <li>How light falls off over distance</li>
      <li>The way different materials reflect or absorb light</li>
      <li>Color bleeding from one surface to another</li>
    </ul>
  `,
  excerpt: "Learn advanced lighting techniques that will transform your digital art",
  publishedAt: "2024-01-15T10:00:00Z",
  readTime: "8 min read",
  likes: 42,
  comments: 18,
  isLocked: true,
}

const mockCreator = {
  id: 1,
  bnsName: "artist",
  displayName: "Digital Artist",
  avatar: "/digital-artist-avatar.png",
  subscriptionPrice: 0.001,
  verified: true,
}

export default function ContentPage({
  params,
}: {
  params: { bnsName: string; postId: string }
}) {
  const [liked, setLiked] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href={`/creator/${params.bnsName}`}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {mockCreator.displayName}
        </Link>

        {/* Post Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={mockCreator.avatar || "/placeholder.svg"} alt={mockCreator.displayName} />
              <AvatarFallback>{mockCreator.displayName.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{mockCreator.displayName}</h3>
                {mockCreator.verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{mockCreator.bnsName}.btc</span>
                <span>•</span>
                <Clock className="w-3 h-3" />
                <span>{formatDate(mockPost.publishedAt)}</span>
                <span>•</span>
                <span>{mockPost.readTime}</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4 text-balance">{mockPost.title}</h1>

          <p className="text-lg text-muted-foreground mb-6">{mockPost.excerpt}</p>
        </div>

        {/* Content Gate */}
        <ContentGate
          creatorId={mockCreator.id}
          creatorName={mockCreator.displayName}
          creatorBnsName={mockCreator.bnsName}
          subscriptionPrice={mockCreator.subscriptionPrice}
          className="mb-8"
        >
          {/* Premium Content */}
          <Card>
            <CardContent className="prose prose-lg max-w-none pt-6">
              <div dangerouslySetInnerHTML={{ __html: mockPost.content }} />
            </CardContent>
          </Card>

          {/* Engagement Actions */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLiked(!liked)}
                    className={liked ? "text-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${liked ? "fill-current" : ""}`} />
                    {mockPost.likes + (liked ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {mockPost.comments}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Subscriber Content</Badge>
              </div>
            </CardContent>
          </Card>
        </ContentGate>

        {/* Related Content */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">More from {mockCreator.displayName}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Color Theory Masterclass</CardTitle>
                <CardDescription>Understanding color relationships in digital art</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">5 min read</span>
                  <Badge variant="outline">Premium</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">NFT Collection Process</CardTitle>
                <CardDescription>Behind the scenes of my latest drop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">12 min read</span>
                  <Badge variant="outline">Premium</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
