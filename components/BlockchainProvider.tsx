'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppConfig, UserSession } from '@stacks/connect';
import { useEffect, useState } from 'react';

export const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function BlockchainProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Handle pending sign-in if coming back from authentication
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(() => {
        window.location.href = '/';
      });
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { userSession };
