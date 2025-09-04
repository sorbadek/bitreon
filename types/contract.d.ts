// Type definitions for Bitreon Core Contract

declare namespace BitreonCore {
  interface Creator {
    owner: string;
    bnsName: string;
    displayName: string;
    bio: string;
    category: string;
    subscriptionPrice: string;
    benefits: string;
    active: boolean;
    createdAt: string;
  }

  interface Subscription {
    subscriber: string;
    creatorId: string;
    amountPaid: string;
    expiresAt: string;
    active: boolean;
    createdAt: string;
  }

  interface NFTCertificate {
    owner: string;
    creatorId: string;
    subscriptionId: string;
    mintedAt: string;
  }

  interface CreatorsPage {
    creators: Creator[];
    total: string;
    hasMore: boolean;
  }
}

export type { BitreonCore };
