// Utility functions for content access control

export interface AccessLevel {
  canView: boolean
  canComment: boolean
  canLike: boolean
  reason?: string
}

export function checkContentAccess(
  isSubscribed: boolean,
  isSignedIn: boolean,
  contentType: "free" | "premium" | "exclusive" = "premium",
): AccessLevel {
  // Free content is always accessible
  if (contentType === "free") {
    return {
      canView: true,
      canComment: isSignedIn,
      canLike: isSignedIn,
    }
  }

  // Premium content requires subscription
  if (contentType === "premium") {
    if (!isSignedIn) {
      return {
        canView: false,
        canComment: false,
        canLike: false,
        reason: "Please connect your wallet to access premium content",
      }
    }

    if (!isSubscribed) {
      return {
        canView: false,
        canComment: false,
        canLike: false,
        reason: "Subscribe to access this premium content",
      }
    }

    return {
      canView: true,
      canComment: true,
      canLike: true,
    }
  }

  // Exclusive content (highest tier)
  if (contentType === "exclusive") {
    if (!isSubscribed) {
      return {
        canView: false,
        canComment: false,
        canLike: false,
        reason: "This exclusive content is only available to subscribers",
      }
    }

    return {
      canView: true,
      canComment: true,
      canLike: true,
    }
  }

  return {
    canView: false,
    canComment: false,
    canLike: false,
    reason: "Access denied",
  }
}

export function getContentTypeLabel(contentType: "free" | "premium" | "exclusive"): string {
  switch (contentType) {
    case "free":
      return "Free"
    case "premium":
      return "Premium"
    case "exclusive":
      return "Exclusive"
    default:
      return "Unknown"
  }
}

export function getContentTypeColor(contentType: "free" | "premium" | "exclusive"): string {
  switch (contentType) {
    case "free":
      return "bg-green-100 text-green-800 border-green-200"
    case "premium":
      return "bg-primary/10 text-primary border-primary/20"
    case "exclusive":
      return "bg-amber-100 text-amber-800 border-amber-200"
    default:
      return "bg-muted text-muted-foreground border-muted"
  }
}
