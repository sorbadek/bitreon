"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bitcoin, Users, Star, ArrowLeft, Shield, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { SubscriptionModal } from "@/components/subscription-modal"
import { getCreatorByBnsName, getCreatorPosts, checkUserSubscription } from "@/lib/database"
import { useBlockchain } from "@/lib/blockchain/useBlockchain"
import { formatSatoshis } from "@/lib/database"

export default function CreatorProfilePage({ params }: { params: { bnsName: string } }) {
  const [creator, setCreator] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const { isConnected, userAddress } = useBlockchain()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCreatorData = async () => {
      try {
        setLoading(true)
        // Fetch creator data
        const creatorData = await getCreatorByBnsName(params.bnsName)
        if (!creatorData) {
          throw new Error('Creator not found')
        }
        setCreator(creatorData)

        // Fetch creator posts
        const postsData = await getCreatorPosts(creatorData.id)
        setPosts(postsData)

        // Check subscription status if user is connected
        if (isConnected && userAddress) {
          const subscription = await checkUserSubscription(creatorData.id, userAddress)
          setIsSubscribed(!!subscription)
        }
      } catch (err) {
        console.error("[v0] Error fetching creator data:", err)
        setError("Failed to load creator data")
      } finally {
        setLoading(false)
      }
    }

    fetchCreatorData()
  }, [params.bnsName])

  const handleSubscribe = () => {
    if (!isConnected) {
      // Show wallet connection prompt
      return
    }
    setShowSubscriptionModal(true)
  }

  const handleSubscriptionSuccess = () => {
    setIsSubscribed(true)
    setShowSubscriptionModal(false)
    // Refresh subscription status
    if (userAddress && creator) {
      checkUserSubscription(creator.id, userAddress).then(setIsSubscribed)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Creator Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "This creator profile doesn't exist."}</p>
          <Button asChild>
            <Link href="/creators">Browse Creators</Link>
          </Button>
        </div>
      </div>
    )
  }

  const renderSubscribeButton = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2">
          <WalletConnect />
          <span className="text-sm text-muted-foreground">Connect wallet to subscribe</span>
        </div>
      )
    }

    if (isSubscribed) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Subscribed
          </Badge>
        </div>
      )
    }

    return (
      <Button onClick={handleSubscribe} className="stacks-gradient text-white border-0" size="lg">
        Subscribe Now
      </Button>
    )
  }

  const renderContentTabs = () => (
    <Tabs defaultValue="posts" className="mt-8">
      <TabsList>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-6">
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription>
                    {new Date(post.timestamp * 1000).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {post.content}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="about" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>About {creator?.display_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{creator?.bio || 'No bio available.'}</p>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span>{creator?.subscriber_count || 0} subscribers</span>
              </div>
              <div className="flex items-center gap-2">
                <Bitcoin className="h-5 w-5 text-amber-500" />
                <span>Subscription: {formatSatoshis(creator?.subscription_price_sats || 0)} STX/month</span>
              </div>
              {creator?.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Category: {creator.category}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/creators" className="flex items-center gap-2">
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

      <div className="container mx-auto px-4 py-8">
        <Link href="/creators" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Creators
        </Link>

        {/* Creator Header */}
        <div className="mb-8">
          <div className="relative h-48 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg mb-6 overflow-hidden">
            <img
              src={creator.banner_url || "/placeholder.svg?height=192&width=800&query=creator banner"}
              alt="Creator banner"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage
                src={creator.avatar_url || "/placeholder.svg?height=96&width=96&query=creator avatar"}
                alt={creator.display_name}
              />
              <AvatarFallback className="text-2xl">{creator.display_name?.slice(0, 2) || "CR"}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{creator.display_name}</h1>
                {creator.isVerified && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-muted-foreground mb-4">
                <span className="font-medium">{creator.bns_name}.btc</span>
                <Badge variant="outline">{creator.category}</Badge>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{creator.subscriber_count?.toLocaleString() || 0} subscribers</span>
                </div>
              </div>

              <p className="text-foreground mb-6 max-w-2xl">{creator.bio}</p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Bitcoin className="w-5 h-5" />
                  <span>{creator.subscription_price_btc} sBTC/week</span>
                </div>
                {renderSubscribeButton()}
              </div>
            </div>
          </div>
        </div>

        {renderContentTabs()}

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          creator={creator}
          onSuccess={handleSubscriptionSuccess}
        />
      </div>
        creator={creator}
        onSuccess={handleSubscriptionSuccess}
      
    </div>
  )
}

function CreatorContentList({
  creatorId,
  userAddress,
  isSubscribed,
}: {
  creatorId: string
  userAddress: string
  isSubscribed: boolean
}) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/creators/${creatorId}/content`, {
          headers: userAddress ? { "X-User-Address": userAddress } : {},
        })
        const content = await response.json()
        setPosts(content)
      } catch (error) {
        console.error("[v0] Error fetching content:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [creatorId, userAddress])

  if (loading) {
    return <div className="text-center py-8">Loading posts...</div>
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No posts yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {post.title}
                  {post.is_premium && !isSubscribed && <Shield className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {post.is_premium && !isSubscribed ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>This content is exclusive to subscribers. Subscribe to unlock!</AlertDescription>
              </Alert>
            ) : (
              <CardDescription>{post.excerpt}</CardDescription>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
