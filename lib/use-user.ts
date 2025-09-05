import { connect, AppConfig, UserSession as StacksUserSession } from '@stacks/connect';
import { useCallback, useEffect, useState } from 'react';

// Initialize the user session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const stacksUserSession = new StacksUserSession({ appConfig });

interface UserProfile {
  _json?: {
    name?: string;
    [key: string]: any;
  };
  name?: string;
  [key: string]: any;
}

// Interface for user data properties
interface UserData {
  profile: UserProfile;
  appPrivateKey: string;
  hubUrl: string;
  identityAddress: string;
  username: string;
  name?: string;
  // Allow additional properties with index signature
  [key: string]: any;
}

export interface UserSessionState {
  isSignedIn: boolean;
  userData: UserData | null;
  userAddress?: string;
  username?: string;
  isLoading: boolean;
}

export interface UserSessionData extends UserSessionState {
  signIn: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

export function useUser() {
  const [userSession, setUserSession] = useState<UserSessionState>({
    isSignedIn: false,
    userData: null,
    isLoading: true
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (stacksUserSession.isUserSignedIn()) {
          const userData = stacksUserSession.loadUserData();
          const { profile, appPrivateKey, hubUrl, identityAddress, username, ...restUserData } = userData as UserData;
          
          setUserSession({
            isSignedIn: true,
            userData: {
              profile: profile || {},
              appPrivateKey: appPrivateKey || '',
              hubUrl: hubUrl || '',
              identityAddress: identityAddress || '',
              username: username || '',
              name: profile?.name || '',
              ...restUserData
            },
            userAddress: identityAddress,
            username: username || '',
            isLoading: false
          });
        } else {
          setUserSession(prev => ({
            ...prev,
            isSignedIn: false,
            userData: null,
            isLoading: false
          }));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Handle user sign in
  const signIn = useCallback(async (): Promise<boolean> => {
    try {
      if (stacksUserSession.isUserSignedIn()) {
        return true;
      }

      // Using a type assertion to handle the connect options
      // as the Stacks Connect API might have changed
      const connectOptions = {
        userSession: stacksUserSession,
        appDetails: {
          name: 'Bitreon',
          icon: window.location.origin + '/icon-192x192.png',
        },
        onFinish: (userData: any) => {
          const { profile, appPrivateKey, hubUrl, identityAddress, username } = userData;
          const displayName = username || profile?.name || profile?._json?.name || '';
          
          setUserSession({
            isSignedIn: true,
            userData: {
              profile: profile || {},
              appPrivateKey: appPrivateKey || '',
              hubUrl: hubUrl || '',
              identityAddress: identityAddress || '',
              username: displayName,
              name: displayName,
              ...userData
            },
            userAddress: identityAddress,
            username: displayName,
            isLoading: false
          });
        },
        onCancel: () => {
          console.log('User canceled the sign in');
        }
      };
      
      await (connect as any)(connectOptions);
      return true;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    }
  }, []);

  // Handle user sign out
  const signOut = useCallback(async (): Promise<boolean> => {
    try {
      await stacksUserSession.signUserOut();
      setUserSession(prev => ({
        ...prev,
        isSignedIn: false,
        userData: null,
        userAddress: undefined,
        username: undefined
      }));
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
    username: userSession.userData?.username,
  } as UserSessionData;

}

export default useUser;
