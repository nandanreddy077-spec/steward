import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';

export default function SplashRouter() {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasOnboarded } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasOnboarded) {
        router.replace('/(main)/home');
      } else {
        router.replace('/auth');
      }
    }
  }, [isLoading, isAuthenticated, hasOnboarded, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.dark.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
