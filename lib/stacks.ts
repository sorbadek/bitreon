import { AppConfig, UserSession } from "@stacks/connect"
import { request } from "@sats-connect/core"

// Network configuration
export const network = process.env.NODE_ENV === "production" ? "mainnet" : "testnet"

const appConfig = new AppConfig(["store_write", "publish_data"])
const userSession = new UserSession({ appConfig })

// Wallet connection state
let connectedAddress: string | null = null
let isConnected = false

export const checkWalletAvailability = () => {
  if (typeof window === "undefined") {
    return {
      hasAnyWallet: false,
      availableWallets: {
        xverse: false,
        hiro: false,
        leather: false,
      },
    }
  }

  // Check for Leather wallet - it exposes itself as window.btc
  const hasLeather = !!(window as any).btc || !!(window as any).LeatherProvider

  // Check for Xverse wallet
  const hasXverse = !!(window as any).XverseProviders?.StacksProvider

  // Check for Hiro wallet
  const hasHiro = !!(window as any).StacksProvider && !(window as any).XverseProviders

  console.log("[v0] Wallet detection:", { hasLeather, hasXverse, hasHiro })

  return {
    hasAnyWallet: hasXverse || hasHiro || hasLeather,
    availableWallets: {
      xverse: hasXverse,
      hiro: hasHiro,
      leather: hasLeather,
    },
  }
}

export const connectWallet = async () => {
  try {
    const walletCheck = checkWalletAvailability()
    console.log("[v0] Wallet availability check:", walletCheck)

    if (!walletCheck.hasAnyWallet) {
      return {
        success: false,
        error: "No compatible wallet found. Please install Xverse, Hiro Wallet, or Leather extension.",
        needsWallet: true,
      }
    }

    // Try Leather wallet first if available
    if (walletCheck.availableWallets.leather) {
      console.log("[v0] Attempting to connect with Leather wallet")
      try {
        return await connectWithLeatherDirect()
      } catch (error) {
        console.log("[v0] Leather connection failed, trying sats-connect:", error)
      }
    }

    // Try Xverse/other wallets with sats-connect
    if (walletCheck.availableWallets.xverse || walletCheck.availableWallets.hiro) {
      console.log("[v0] Attempting to connect with sats-connect")
      return await connectWithSatsConnect()
    }

    throw new Error("No compatible wallet connection method found")
  } catch (error) {
    console.error("[v0] Error connecting wallet:", error)
    const errorMessage = (error as any).message || "Failed to connect wallet"

    return {
      success: false,
      error: errorMessage,
      needsWallet: false,
    }
  }
}

const connectWithLeatherDirect = async () => {
  const btcProvider = (window as any).btc
  if (!btcProvider) {
    throw new Error("Leather wallet not found")
  }

  try {
    // Request connection to Leather wallet
    const response = await btcProvider.request("getAddresses")
    console.log("[v0] Leather response:", response)

    if (response && response.result && response.result.addresses) {
      const stacksAddress = response.result.addresses.find(
        (addr: any) => addr.type === "stacks" || addr.symbol === "STX",
      )

      if (stacksAddress) {
        connectedAddress = stacksAddress.address
        isConnected = true
        console.log("[v0] Leather wallet connected:", connectedAddress)
        return { success: true, address: connectedAddress }
      }
    }

    throw new Error("No Stacks address found in Leather wallet")
  } catch (error) {
    console.error("[v0] Leather direct connection error:", error)
    throw error
  }
}

const connectWithSatsConnect = async () => {
  const response = await request("wallet_connect", {
    addresses: ["stacks"],
  })

  console.log("[v0] Wallet connect response:", response)

  if (response.status === "success" && response.result.addresses) {
    const stacksAddress = response.result.addresses.find((addr: any) => addr.type === "stacks")
    if (stacksAddress) {
      connectedAddress = stacksAddress.address
      isConnected = true
      console.log("[v0] Wallet connected:", connectedAddress)
      return { success: true, address: connectedAddress }
    }
  }

  throw new Error("Failed to get Stacks address from sats-connect")
}

export const getAccounts = async () => {
  try {
    const walletCheck = checkWalletAvailability()
    if (!walletCheck.hasAnyWallet) {
      return {
        success: false,
        error: "No compatible wallet found. Please install Xverse, Hiro Wallet, or Leather extension.",
        needsWallet: true,
      }
    }

    const response = await request("getAccounts", null)

    if (response.status === "success" && response.result) {
      const stacksAccount = response.result.find((account: any) => account.type === "stacks")
      if (stacksAccount) {
        connectedAddress = stacksAccount.address
        isConnected = true
        return { success: true, address: connectedAddress }
      }
    }

    return { success: false, error: "No Stacks account found" }
  } catch (error) {
    console.error("Error getting accounts:", error)
    const errorMessage = error.message.includes("no wallet provider")
      ? "No compatible wallet found. Please install Xverse, Hiro Wallet, or Leather extension."
      : error.message

    return {
      success: false,
      error: errorMessage,
      needsWallet: error.message.includes("no wallet provider"),
    }
  }
}

export const isUserSignedIn = () => {
  return (isConnected && connectedAddress !== null) || userSession.isUserSignedIn()
}

export const getUserData = () => {
  if (userSession.isUserSignedIn()) {
    return userSession.loadUserData()
  }

  if (!isConnected || !connectedAddress) {
    return null
  }

  return {
    profile: {
      stxAddress: {
        testnet: connectedAddress,
        mainnet: connectedAddress,
      },
    },
  }
}

export const signOut = () => {
  connectedAddress = null
  isConnected = false
  if (userSession.isUserSignedIn()) {
    userSession.signUserOut()
  }
  window.location.href = "/"
}

export const handlePendingSignIn = async () => {
  if (userSession.isSignInPending()) {
    const userData = await userSession.handlePendingSignIn()
    return userData
  }

  if (isConnected && connectedAddress) {
    return getUserData()
  }
  return null
}

export const getUserAddress = (): string => {
  if (connectedAddress) {
    return connectedAddress
  }

  if (userSession.isUserSignedIn()) {
    const userData = userSession.loadUserData()
    return userData.profile.stxAddress[network] || ""
  }

  return ""
}
