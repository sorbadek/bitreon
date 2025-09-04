"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { connectWallet, isUserSignedIn, getUserData, signOut, handlePendingSignIn } from "@/lib/stacks"
import { Wallet, LogOut, ExternalLink, AlertCircle } from "lucide-react"

export default function WalletConnect() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsWallet, setNeedsWallet] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const pendingUserData = await handlePendingSignIn()
        if (pendingUserData) {
          setUserData(pendingUserData)
          setIsSignedIn(true)
        } else if (isUserSignedIn()) {
          setUserData(getUserData())
          setIsSignedIn(true)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)
    setNeedsWallet(false)

    const result = await connectWallet()

    if (result.success) {
      setUserData(getUserData())
      setIsSignedIn(true)
    } else {
      setError(result.error)
      setNeedsWallet(result.needsWallet || false)
    }

    setIsLoading(false)
  }

  const handleSignOut = () => {
    signOut()
    setIsSignedIn(false)
    setUserData(null)
    setError(null)
    setNeedsWallet(false)
  }

  if (isLoading) {
    return (
      <Button disabled className="stacks-gradient text-white border-0">
        <Wallet className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (isSignedIn && userData) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{userData.profile?.stxAddress?.testnet?.slice(0, 8)}...</span>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleConnect} className="stacks-gradient text-white border-0" disabled={isLoading}>
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>

      {error && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {needsWallet && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium">Install a compatible wallet:</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.xverse.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    Xverse <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <a
                    href="https://wallet.hiro.so/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    Hiro Wallet <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                  <a
                    href="https://leather.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                  >
                    Leather <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export { WalletConnect }
