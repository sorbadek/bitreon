"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bitcoin,
  Users,
  TrendingUp,
  Shield,
  Plus,
  Settings,
  Calendar,
  Heart,
  Eye,
  ArrowUpRight,
  Star,
} from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { isUserSignedIn, getUserData } from "@/lib/stacks"
import {
  getCreatorByAddress,
  getUserSubscriptions,
  getCreatorPosts,
  formatSatoshis,
  type Creator,
  type Subscription,
  type Post,
} from "@/lib/database"

export default function DashboardPage() {
  const [userType, setUserType] = useState<"creator" | "fan" | "new" | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [creatorData, setCreatorData] = useState<Creator | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserStatus = async () => {
      const signedIn = isUserSignedIn()
      setIsSignedIn(signedIn)

      if (!signedIn) {
        setLoading(false)
        return
      }

      const user = getUserData()
      setUserData(user)

      try {
        console.log("[v0] Checking user status for:", user.profile.stxAddress.testnet)

        const creator = await getCreatorByAddress(user.profile.stxAddress.testnet)
        console.log("[v0] Creator result:", creator)

        if (creator) {
          setUserType("creator")
          setCreatorData(creator)

          const creatorPosts = await getCreatorPosts(creator.id)
          setPosts(creatorPosts)
        } else {
          const userSubs = await getUserSubscriptions(user.profile.stxAddress.testnet)
          console.log("[v0] User subscriptions:", userSubs)

          if (userSubs.length > 0) {
            setUserType("fan")
            setSubscriptions(userSubs)
          } else {
            setUserType("new")
          }
        }
      } catch (error: any) {
        console.error("[v0] Error checking user status:", error)
        // Default to new user when there's an error
        setUserType("new")
      } finally {
        setLoading(false)
      }
    }

    checkUserStatus()
  }, [])

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
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

        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-8">Please connect your wallet to access your dashboard</p>
          <WalletConnect />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
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
              <Link href="/creators">Explore</Link>
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {userType === "creator" && <CreatorDashboard creator={creatorData!} posts={posts} />}
        {userType === "fan" && <FanDashboard subscriptions={subscriptions} />}
        {userType === "new" && <NewUserDashboard />}
      </div>
    </div>
  )
}

function CreatorDashboard({ creator, posts }: { creator: Creator; posts: Post[] }) {
  const totalViews = posts.reduce((sum, post) => sum + post.likes_count * 10, 0) // Estimate views from likes
  const monthlyEarnings = creator.total_earnings_sats * 0.3 // Estimate 30% is from this month

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your content and track your earnings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/creator/settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button className="stacks-gradient text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creator.subscriber_count.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSatoshis(creator.total_earnings_sats)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSatoshis(monthlyEarnings)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Posts</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
            <p className="text-xs text-muted-foreground">Total published</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Recent Posts</TabsTrigger>
          <TabsTrigger value="subscribers">New Subscribers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Posts</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{post.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{post.likes_count * 10}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.published_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{post.is_premium ? "premium" : "free"}</Badge>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No posts yet. Create your first post to get started!</p>
                  <Button className="mt-4" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Recent Subscribers</CardTitle>
              <CardDescription>New subscribers from the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Subscriber analytics coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Detailed analytics coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard will be available in the next update</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FanDashboard({ subscriptions }: { subscriptions: Subscription[] }) {
  const totalSpent = subscriptions.reduce((sum, sub) => sum + sub.price_paid_sats, 0)
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active").length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Subscriptions</h1>
          <p className="text-muted-foreground">Manage your subscriptions and NFT badges</p>
        </div>
        <Button asChild>
          <Link href="/creators">
            <Plus className="w-4 h-4 mr-2" />
            Find Creators
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NFT Badges</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Collected badges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Bitcoin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSatoshis(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Subscriptions</h3>
        {subscriptions.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="/placeholder.svg" alt="Creator" />
                      <AvatarFallback>CR</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">Creator</CardTitle>
                      <CardDescription>creator.btc</CardDescription>
                    </div>
                    <Badge
                      className={
                        subscription.status === "active"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {subscription.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span>{new Date(subscription.expires_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="flex items-center gap-1">
                        <Bitcoin className="w-3 h-3" />
                        {formatSatoshis(subscription.price_paid_sats)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tier</span>
                      <span className="capitalize">{subscription.tier}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        View Content
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">You don't have any active subscriptions yet.</p>
              <Button asChild>
                <Link href="/creators">Find Creators to Support</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* NFT Badge Collection */}
      {subscriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">NFT Badge Collection</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {subscriptions.map((subscription, index) => (
                  <div key={subscription.id} className="text-center p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-2 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-medium text-sm">Creator Badge</p>
                    <p className="text-xs text-muted-foreground">#{index + 1}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function NewUserDashboard() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-foreground mb-4">Welcome to Bitreon!</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Get started by exploring creators or becoming a creator yourself. Support your favorite creators with Bitcoin
          and unlock exclusive content.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button size="lg" className="stacks-gradient text-white border-0" asChild>
            <Link href="/creator/register">Become a Creator</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/creators">Explore Creators</Link>
          </Button>
        </div>
      </div>

      {/* Getting Started Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bitcoin-gradient rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Find Creators</CardTitle>
            <CardDescription>Discover amazing creators and support them with Bitcoin</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/creators">Browse Creators</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 stacks-gradient rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Become a Creator</CardTitle>
            <CardDescription>Start earning Bitcoin by sharing your content with subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/creator/register">Get Started</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Collect NFT Badges</CardTitle>
            <CardDescription>Get unique NFT badges when you subscribe to creators</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
