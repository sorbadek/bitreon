"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
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
  Loader2,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { isUserSignedIn, getUserData } from "@/lib/stacks"
import { formatSatoshis } from "@/lib/database"
import { 
  getCreatorByOwner, 
  getCreator, 
  getUserSubscription, 
  isUserSubscribed, 
  type Creator as ContractCreator,
  type Subscription as ContractSubscription,
  useBitreonContract 
} from "@/lib/bitreon-contract"

// Local types that match our UI needs
type Post = {
  id: string;
  title: string;
  content: string;
  is_premium: boolean;
  timestamp: number;
  creator_id: string;
};

type Subscription = ContractSubscription & {
  creator?: ContractCreator;
};

export default function DashboardPage() {
  const [userType, setUserType] = useState<"creator" | "fan" | "new" | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [creatorData, setCreatorData] = useState<ContractCreator | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize contract hooks
  const { registerCreator, subscribeToCreator } = useBitreonContract()

  useEffect(() => {
    const checkUserStatus = async () => {
      const signedIn = isUserSignedIn()
      setIsSignedIn(signedIn)

      if (!signedIn) {
        setLoading(false)
        return
      }

      try {
        setError(null)
        const data = getUserData()
        if (!data?.profile?.stxAddress?.testnet) {
          throw new Error("User address not available")
        }
        
        setUserData(data)
        const userAddress = data.profile.stxAddress.testnet

        // Check if user is a creator
        const creator = await getCreatorByOwner(userAddress)
        if (creator) {
          setCreatorData(creator)
          setUserType("creator")
          
          // TODO: Load creator posts from a different source or implement in contract
          // For now, we'll use an empty array
          setPosts([])
        } else {
          // Check if user has subscriptions
          // Note: This is a simplified approach - in a real app, you'd need to track subscriptions
          // by querying the contract for the user's subscription NFTs or events
          const hasActiveSubscriptions = false; // TODO: Implement actual check
          
          if (hasActiveSubscriptions) {
            // TODO: Fetch actual subscriptions
            setUserType("fan")
          } else {
            setUserType("new")
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError(error instanceof Error ? error.message : "Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    checkUserStatus()
  }, [])

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Connect your wallet</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Connect your Stacks wallet to access your dashboard and manage your subscriptions.
        </p>
        <WalletConnect />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">Error loading dashboard</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
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

function CreatorDashboard({ creator, posts }: { creator: ContractCreator; posts: Post[] }) {
  // Format subscription price from microSTX to STX
  const subscriptionPrice = parseInt(creator['subscription-price']) / 1000000;
  
  // Mock stats - in a real app, you'd query these from the contract
  const stats = [
    { label: "Total Subscribers", value: "0", icon: Users },
    { label: "Monthly Revenue", value: `${subscriptionPrice} STX`, icon: TrendingUp },
    { label: "Total Earnings", value: `${subscriptionPrice} STX`, icon: Bitcoin },
  ]

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
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
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
                  <p className="text-muted-foreground mb-4">No posts yet. Create your first post to get started!</p>
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
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://source.boringavatars.com/marble/80/${subscription.creator?.owner}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`} alt={subscription.creator?.['display-name']} />
                      <AvatarFallback>{subscription.creator?.['display-name']?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-3xl font-bold">{subscription.creator?.['display-name'] || 'Creator'}</h1>
                      <p className="text-muted-foreground">@{subscription.creator?.['bns-name'] || subscription.creator?.owner}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span>{new Date(subscription.expires_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-sm text-muted-foreground">{subscription.creator?.bio || "No bio provided."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subscription.creator?.category && (
                        <Badge variant="outline">{subscription.creator?.category}</Badge>
                      )}
                      <Badge variant="outline">{parseInt(subscription.price_paid_sats) / 1000000} STX/month</Badge>
                      <Badge variant="secondary">On-chain</Badge>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-1">Subscription Benefits</h4>
                      <p className="text-sm text-muted-foreground">{subscription.creator?.benefits || 'No benefits specified.'}</p>
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
