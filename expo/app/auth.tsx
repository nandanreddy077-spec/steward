import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chrome, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';
import { User } from '@/types';
import { authAPI } from '@/utils/api';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle deep links for OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('Deep link received:', url);
      
      // Check if this is an OAuth callback (multiple formats possible)
      const isOAuthCallback = 
        url.includes('auth/callback') || 
        url.includes('auth?') ||
        url.includes('callback?');
      
      if (isOAuthCallback) {
        const parsedUrl = Linking.parse(url);
        const params = parsedUrl.queryParams;
        
        console.log('Parsed URL params:', params);
        
        // Check for success and userId in params
        if (params?.success === 'true' && params?.userId) {
          // OAuth successful!
          setIsLoading(null);
          
          try {
            // Fetch user data from backend to ensure we have latest info
            const userResponse = await authAPI.getUser(params.userId as string);
            
            if (userResponse.error || !userResponse.data) {
              throw new Error(userResponse.error || 'Failed to fetch user data');
            }

            const userData = userResponse.data.user;
            
            // Create user object
            const user: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name || 'User',
              subscription: 'trial',
              connectedAccounts: {
                google: userData.hasGoogleTokens,
                microsoft: false,
              },
            };
            
            login(user);
            router.replace('/(main)/home');
          } catch (error: any) {
            console.error('Error handling OAuth callback:', error);
            Alert.alert('Error', error.message || 'Failed to complete authentication');
            setIsLoading(null);
          }
        } else {
          console.log('OAuth callback received but missing required params:', params);
        }
      }
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened via deep link (when app was closed)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [login, router]);

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    if (provider !== 'google') {
      Alert.alert('Not Supported', 'Microsoft authentication coming soon!');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading('google');

    try {
      // Step 1: Get OAuth URL from backend
      const authUrlResponse = await authAPI.getGoogleAuthUrl();
      
      if (authUrlResponse.error || !authUrlResponse.data) {
        Alert.alert('Error', authUrlResponse.error || 'Failed to get OAuth URL');
        setIsLoading(null);
        return;
      }

      const authUrl = authUrlResponse.data.authUrl;
      const redirectUrl = Linking.createURL('/auth/callback');

      // Step 2: Open browser for authentication with deep link callback
      // openAuthSessionAsync handles the OAuth flow and redirects back to app
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl
      );

      console.log('WebBrowser result:', result);

      // Check if result contains the redirect URL
      if (result.type === 'success' && result.url) {
        // The redirect URL is in the result
        console.log('OAuth redirect URL in result:', result.url);
        // Process it as a deep link
        const parsedUrl = Linking.parse(result.url);
        const params = parsedUrl.queryParams;
        
        if (params?.success === 'true' && params?.userId) {
          setIsLoading(null);
          
          try {
            const userResponse = await authAPI.getUser(params.userId as string);
            
            if (userResponse.error || !userResponse.data) {
              throw new Error(userResponse.error || 'Failed to fetch user data');
            }

            const userData = userResponse.data.user;
            
            const user: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name || 'User',
              subscription: 'trial',
              connectedAccounts: {
                google: userData.hasGoogleTokens,
                microsoft: false,
              },
            };
            
            login(user);
            router.replace('/(main)/home');
          } catch (error: any) {
            console.error('Error handling OAuth result:', error);
            Alert.alert('Error', error.message || 'Failed to complete authentication');
            setIsLoading(null);
          }
        } else {
          console.log('OAuth result missing required params:', params);
          setIsLoading(null);
        }
      } else if (result.type === 'dismiss' || result.type === 'cancel') {
        // User dismissed or cancelled
        setIsLoading(null);
      } else if (result.type === 'locked') {
        Alert.alert('Error', 'Please unlock your device to continue');
        setIsLoading(null);
      } else {
        // Other result types - the deep link handler will catch it
        console.log('WebBrowser result type:', result.type);
        // Don't reset loading here - let deep link handler process it
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      Alert.alert('Error', error.message || 'OAuth authentication failed');
      setIsLoading(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.backgroundPattern}>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternLine,
              { top: 80 + i * 120, opacity: 0.03 + i * 0.01 },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>C</Text>
            </View>
          </View>
          <Text style={styles.title}>Chief</Text>
          <Text style={styles.subtitle}>Your AI Executive Assistant</Text>
        </View>

        <View style={styles.valueProps}>
          <Text style={styles.tagline}>Tell it what to do.</Text>
          <Text style={styles.taglineAccent}>It gets it done.</Text>
        </View>

        <View style={styles.features}>
          {['Calendar Management', 'Email Handling', 'Reservations'].map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={[styles.authSection, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.authButton, styles.googleButton]}
          onPress={() => handleOAuth('google')}
          disabled={isLoading !== null}
          activeOpacity={0.8}
        >
          <Chrome size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.authButtonText}>
            {isLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.authButton, styles.microsoftButton]}
          onPress={() => handleOAuth('microsoft')}
          disabled={isLoading !== null}
          activeOpacity={0.8}
        >
          <Mail size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.authButtonText}>
            {isLoading === 'microsoft' ? 'Connecting...' : 'Continue with Microsoft'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  patternLine: {
    position: 'absolute',
    left: -50,
    right: -50,
    height: 1,
    backgroundColor: Colors.dark.accent,
    transform: [{ rotate: '-12deg' }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginTop: 8,
  },
  valueProps: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
  },
  taglineAccent: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  features: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
  },
  featureText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  authSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  googleButton: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  microsoftButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  terms: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
