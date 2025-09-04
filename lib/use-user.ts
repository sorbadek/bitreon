import { connect, UserSession, AppConfig } from '@stacks/connect';
import { useCallback, useEffect, useState } from 'react';

// Initialize the user session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export interface UserSession {
  isSignedIn: boolean;
  userData: {
    profile: any;
    appPrivateKey: string;
    hubUrl: string;
    identityAddress: string;
    username?: string;
  } | null;
}

export function useUser() {
  const [userSession, setUserSession] = useState<UserSession>({
    isSignedIn: false,
    userData: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          setUserSession({
            isSignedIn: true,
            userData: {
              profile: userData.profile,
              appPrivateKey: userData.appPrivateKey,
              hubUrl: userData.hubUrl,
              identityAddress: userData.identityAddress,
              username: userData.username,
            },
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Handle user sign in
  const signIn = useCallback(async () => {
    try {
      if (userSession.isUserSignedIn()) {
        return true;
      }

      await connect({
        userSession,
        appDetails: {
          name: 'Bitreon',
          icon: window.location.origin + '/icon-192x192.png',
        },
        onFinish: () => {
          const userData = userSession.loadUserData();
          setUserSession({
            isSignedIn: true,
            userData: {
              profile: userData.profile,
              appPrivateKey: userData.appPrivateKey,
              hubUrl: userData.hubUrl,
              identityAddress: userData.identityAddress,
              username: userData.username,
            },
          });
        },
        onCancel: () => {
          console.log('User canceled the sign in');
        },
      });
      return true;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    }
  }, []);

  // Handle user sign out
  const signOut = useCallback(async () => {
    try {
      userSession.signUserOut();
      setUserSession({
        isSignedIn: false,
        userData: null,
      });
      return true;
    } catch (error) {
      console.error('Sign out failed:', error);
      return false;
    }
  }, []);

  return {
    ...userSession,
    isLoading,
    signIn,
    signOut,
    userAddress: userSession.userData?.identityAddress,
    username: userSession.userData?.username || '',
  };
}

export default useUser;
