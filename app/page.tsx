import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bitcoin, Users, Shield, Zap } from "lucide-react"
import WalletConnect from "@/components/wallet-connect"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bitcoin-gradient rounded-lg flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Bitreon</h1>
          </div>
          <div className="flex items-center gap-4">
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">Built on Bitcoin via Stacks</Badge>
          <h2 className="text-5xl font-bold text-foreground mb-6 text-balance">
            Support Creators with <span className="stacks-gradient bg-clip-text text-transparent">Bitcoin</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            The first creator subscription platform built on Bitcoin. Subscribe with sBTC, get exclusive NFT badges, and
            unlock premium content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="stacks-gradient text-white border-0" asChild>
              <Link href="/creator/register">Start Creating</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/creators">Explore Creators</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose Bitreon?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bitcoin-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bitcoin className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Bitcoin Native</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Pay with sBTC and earn Bitcoin rewards through Stacking</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 stacks-gradient rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle>NFT Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Get unique NFT badges that prove your subscription status</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>BNS Identity</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Creators get verified .btc names for authentic identity</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Smart Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Automated subscriptions and content gating via Clarity</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-3xl font-bold mb-6 text-foreground">Ready to Get Started?</h3>
          <p className="text-lg text-muted-foreground mb-8">Join the future of creator economy on Bitcoin</p>
          <Button size="lg" className="stacks-gradient text-white border-0">
            Connect Your Wallet
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Bitreon. Built on Bitcoin via Stacks.</p>
        </div>
      </footer>
    </div>
  )
}
