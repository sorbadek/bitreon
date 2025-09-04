'use client';

import { useBlockchain } from '@/lib/blockchain/useBlockchain';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { userSession } from '@/lib/blockchain/client';

export function WalletConnect() {
  const { isConnected, userAddress, connectWallet, disconnectWallet } = useBlockchain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" className="w-32" disabled>
        Loading...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">
          {`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
        </span>
        <Button variant="outline" onClick={disconnectWallet}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connectWallet}>
      Connect Wallet
    </Button>
  );
}
