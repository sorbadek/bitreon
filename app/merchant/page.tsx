"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bitcoin, TrendingUp, Users, LinkIcon, Copy, Download, Settings, BarChart3, Webhook } from "lucide-react"
import { getMerchantStats, createPaymentLink, getBTCPrice } from "@/lib/payment-integration"
import { formatBTC } from "@/lib/sbTC"
import Link from "next/link"

export default function MerchantDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalSubscribers: 0,
    activeSubscribers: 0,
    conversionRate: 0,
    averageSubscriptionValue: 0,
  })
  const [btcPrice, setBtcPrice] = useState(45000)
  const [paymentLink, setPaymentLink] = useState("")
  const [linkAmount, setLinkAmount] = useState("0.001")
  const [linkDescription, setLinkDescription] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [merchantStats, price] = await Promise.all([
          getMerchantStats(1), // Mock creator ID
          getBTCPrice(),
        ])
        setStats(merchantStats)
        setBtcPrice(price)
      } catch (error) {
        console.error("Error fetching merchant data:", error)
      }
    }

    fetchData()
  }, [])

  const handleCreatePaymentLink = async () => {
    try {
      const link = await createPaymentLink(
        1, // Mock creator ID
        Number.parseFloat(linkAmount),
        "BTC",
        linkDescription || "Payment for subscription",
      )
      setPaymentLink(link.url)
    } catch (error) {
      console.error("Error creating payment link:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
            <h1 className="text-2xl font-bold text-foreground">Bitreon Merchant</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Merchant Dashboard</h1>
          <p className="text-muted-foreground">Manage payments, subscriptions, and integrations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Bitcoin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBTC(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">≈ ${(stats.totalRevenue * btcPrice).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBTC(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscribers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.activeSubscribers / stats.totalSubscribers) * 100).toFixed(1)}% retention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.conversionRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Visitor to subscriber</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="links">Payment Links</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock payment data */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Bitcoin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Subscription Payment</p>
                        <p className="text-sm text-muted-foreground">user_123 • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatBTC(0.001)}</p>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Payment Link</CardTitle>
                <CardDescription>Generate shareable payment links for subscriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (BTC)</Label>
                    <Input
                      id="amount"
                      value={linkAmount}
                      onChange={(e) => setLinkAmount(e.target.value)}
                      placeholder="0.001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={linkDescription}
                      onChange={(e) => setLinkDescription(e.target.value)}
                      placeholder="Premium subscription"
                    />
                  </div>
                </div>
                <Button onClick={handleCreatePaymentLink} className="w-full">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Create Payment Link
                </Button>
                {paymentLink && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label>Generated Payment Link</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input value={paymentLink} readOnly className="flex-1" />
                      <Button size="sm" onClick={() => copyToClipboard(paymentLink)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Embeddable Widgets</CardTitle>
                <CardDescription>Drop-in payment widgets for your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Subscription Widget</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <code className="text-sm">
                      {`<script src="https://bitreon.app/widget.js"></script>
<div id="bitreon-widget" 
     data-creator-id="1" 
     data-theme="light">
</div>`}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      copyToClipboard(`<script src="https://bitreon.app/widget.js"></script>
<div id="bitreon-widget" data-creator-id="1" data-theme="light"></div>`)
                    }
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Payment Button</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <code className="text-sm">
                      {`<button class="bitreon-pay-btn" 
        data-amount="0.001" 
        data-currency="BTC"
        data-creator-id="1">
  Subscribe with Bitcoin
</button>`}
                    </code>
                  </div>
                  <Button size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
                <CardDescription>Integrate Bitreon payments into your application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Create Subscription</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <code className="text-sm whitespace-pre">
                      {`POST /api/subscriptions
{
  "creatorId": 1,
  "subscriberId": "user_123",
  "tier": "premium",
  "autoRenew": true
}`}
                    </code>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Process Payment</h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <code className="text-sm whitespace-pre">
                      {`POST /api/payments
{
  "recipientAddress": "SP...",
  "amount": 0.001,
  "memo": "Subscription payment",
  "creatorId": 1
}`}
                    </code>
                  </div>
                </div>

                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Download API Documentation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>Receive real-time notifications for payment events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input id="webhook-url" placeholder="https://your-site.com/webhooks/bitreon" />
                </div>
                <div className="space-y-2">
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2">
                    {[
                      "payment.confirmed",
                      "payment.failed",
                      "subscription.created",
                      "subscription.expired",
                      "subscription.renewed",
                    ].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <input type="checkbox" id={event} defaultChecked />
                        <Label htmlFor={event} className="text-sm">
                          {event}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button>
                  <Webhook className="w-4 h-4 mr-2" />
                  Save Webhook Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
