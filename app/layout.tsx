import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import "./globals.css"
import { BlockchainProvider } from "@/components/BlockchainProvider"

export const metadata: Metadata = {
  title: "Bitreon - Creator Subscriptions on Bitcoin",
  description: "Support creators with Bitcoin. Subscribe with sBTC, get NFT badges, unlock exclusive content.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <BlockchainProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </BlockchainProvider>
      </body>
    </html>
  )
}
