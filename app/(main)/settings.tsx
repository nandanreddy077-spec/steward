import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Calendar,
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  Check,
  Crown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, settings, updateSettings, logout } = useApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    Haptics.selectionAsync();
    updateSettings({ [key]: value });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsLoggingOut(true);
            setTimeout(() => {
              logout();
              router.replace('/auth');
            }, 500);
          },
        },
      ]
    );
  };

  const getSubscriptionLabel = () => {
    switch (user?.subscription) {
      case 'executive':
        return 'Executive';
      case 'pro':
        return 'Pro';
      default:
        return 'Trial';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
          </View>
          <View style={styles.subscriptionBadge}>
            <Crown size={12} color={Colors.dark.accent} />
            <Text style={styles.subscriptionText}>{getSubscriptionLabel()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.7}
              onPress={() => {
                if (!user?.connectedAccounts.google) {
                  router.push('/auth');
                } else {
                  Alert.alert(
                    'Reconnect Google',
                    'Do you want to reconnect your Google account?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Reconnect', 
                        onPress: () => router.push('/auth')
                      }
                    ]
                  );
                }
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.infoMuted }]}>
                  <Calendar size={18} color={Colors.dark.info} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Google Calendar</Text>
                  <Text style={styles.settingDescription}>
                    {user?.connectedAccounts.google ? 'Connected' : 'Tap to connect'}
                  </Text>
                </View>
              </View>
              {user?.connectedAccounts.google ? (
                <Check size={20} color={Colors.dark.success} />
              ) : (
                <ChevronRight size={20} color={Colors.dark.textMuted} />
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.settingItem} 
              activeOpacity={0.7}
              onPress={() => {
                if (!user?.connectedAccounts.google) {
                  router.push('/auth');
                } else {
                  Alert.alert(
                    'Reconnect Google',
                    'Do you want to reconnect your Google account?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Reconnect', 
                        onPress: () => router.push('/auth')
                      }
                    ]
                  );
                }
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.successMuted }]}>
                  <Mail size={18} color={Colors.dark.success} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Gmail</Text>
                  <Text style={styles.settingDescription}>
                    {user?.connectedAccounts.google ? 'Connected' : 'Tap to connect'}
                  </Text>
                </View>
              </View>
              {user?.connectedAccounts.google ? (
                <Check size={20} color={Colors.dark.success} />
              ) : (
                <ChevronRight size={20} color={Colors.dark.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Approve</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.accentMuted }]}>
                  <Bell size={18} color={Colors.dark.accent} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Reminders</Text>
                  <Text style={styles.settingDescription}>Auto-approve reminder tasks</Text>
                </View>
              </View>
              <Switch
                value={settings.autoApproveReminders}
                onValueChange={(v) => handleToggle('autoApproveReminders', v)}
                trackColor={{ false: Colors.dark.surfaceElevated, true: Colors.dark.accent }}
                thumbColor={Colors.dark.text}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.infoMuted }]}>
                  <Calendar size={18} color={Colors.dark.info} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Calendar Blocks</Text>
                  <Text style={styles.settingDescription}>Auto-approve focus time blocks</Text>
                </View>
              </View>
              <Switch
                value={settings.autoApproveCalendarBlocks}
                onValueChange={(v) => handleToggle('autoApproveCalendarBlocks', v)}
                trackColor={{ false: Colors.dark.surfaceElevated, true: Colors.dark.accent }}
                thumbColor={Colors.dark.text}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.successMuted }]}>
                  <Mail size={18} color={Colors.dark.success} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Summaries</Text>
                  <Text style={styles.settingDescription}>Auto-approve inbox summaries</Text>
                </View>
              </View>
              <Switch
                value={settings.autoApproveSummaries}
                onValueChange={(v) => handleToggle('autoApproveSummaries', v)}
                trackColor={{ false: Colors.dark.surfaceElevated, true: Colors.dark.accent }}
                thumbColor={Colors.dark.text}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.warningMuted }]}>
                  <Bell size={18} color={Colors.dark.warning} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingDescription}>Task updates and reminders</Text>
                </View>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) => handleToggle('notificationsEnabled', v)}
                trackColor={{ false: Colors.dark.surfaceElevated, true: Colors.dark.accent }}
                thumbColor={Colors.dark.text}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.infoMuted }]}>
                  <User size={18} color={Colors.dark.info} />
                </View>
                <Text style={styles.settingLabel}>Profile</Text>
              </View>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.accentMuted }]}>
                  <Crown size={18} color={Colors.dark.accent} />
                </View>
                <Text style={styles.settingLabel}>Subscription</Text>
              </View>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.dark.surfaceElevated }]}>
                  <Shield size={18} color={Colors.dark.textSecondary} />
                </View>
                <Text style={styles.settingLabel}>Privacy & Security</Text>
              </View>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isLoggingOut}
        >
          <LogOut size={20} color={Colors.dark.error} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.accentMuted,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.borderLight,
    marginLeft: 62,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.errorMuted,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.error,
  },
  version: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
