"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bitcoin, Search, Users, Star } from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { getAllCreators, formatSatoshis, type Creator } from "@/lib/database"
import { useBlockchain } from "@/lib/blockchain/useBlockchain"

export default function CreatorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [creators, setCreators] = useState<Creator[]>([])
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const { isConnected } = useBlockchain()

  const categories = ["All", "Art", "Music", "Tech", "Photography", "Writing"]

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        console.log("[v0] Fetching creators from blockchain...")
        const creatorsData = await getAllCreators()
        console.log("[v0] Fetched creators:", creatorsData.length)
        setCreators(creatorsData)
        setFilteredCreators(creatorsData)
      } catch (error) {
        console.error("[v0] Error fetching creators:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
  }, [])

  useEffect(() => {
    let filtered = creators

    if (searchTerm) {
      filtered = filtered.filter(
        (creator) =>
          creator.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          creator.bns_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          creator.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((creator) => creator.category === selectedCategory)
    }

    setFilteredCreators(filtered)
  }, [searchTerm, selectedCategory, creators])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading creators...</p>
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
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Creators</h1>
          <p className="text-muted-foreground">Support your favorite creators with Bitcoin</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search creators..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WalletConnect />
            {!isConnected && (
              <p className="text-sm text-muted-foreground">
                Connect your wallet to subscribe
              </p>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Creators Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <Card key={creator.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={creator.avatar_url || "/placeholder.svg"} alt={creator.display_name} />
                    <AvatarFallback>{creator.display_name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{creator.display_name}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      @{creator.bns_name}
                      {creator.verified && <Badge variant="outline">Verified</Badge>}
                      <span className="flex items-center text-sm text-amber-500">
                        <Bitcoin className="h-3 w-3 mr-1" />
                        {formatSatoshis(creator.subscription_price_sats)} STX/month
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 line-clamp-2">{creator.bio}</CardDescription>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{creator.subscriber_count} subscribers</span>
                    </div>
                    {creator.category && (
                      <Badge variant="outline">
                        {creator.category}
                      </Badge>
                    )}
                  </div>

                  <Button className="w-full stacks-gradient text-white border-0" asChild>
                    <Link href={`/creator/${creator.bns_name}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCreators.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {creators.length === 0
                ? "No creators found. Be the first to register as a creator!"
                : "No creators found matching your criteria."}
            </p>
            {creators.length === 0 && (
              <Button className="mt-4" asChild>
                <Link href="/creator/register">Register as Creator</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
