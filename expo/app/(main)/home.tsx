import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Mail,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getDailyBrief, pendingTasks } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const brief = getDailyBrief();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.date}>{formatDate()}</Text>
          </View>

          {pendingTasks.length > 0 && (
            <TouchableOpacity
              style={styles.pendingBanner}
              onPress={() => router.push(`/approval/${pendingTasks[0].id}` as const)}
              activeOpacity={0.8}
            >
              <View style={styles.pendingIcon}>
                <AlertCircle size={20} color={Colors.dark.warning} />
              </View>
              <View style={styles.pendingContent}>
                <Text style={styles.pendingTitle}>
                  {pendingTasks.length} task{pendingTasks.length > 1 ? 's' : ''} awaiting approval
                </Text>
                <Text style={styles.pendingSubtitle}>Tap to review</Text>
              </View>
              <ChevronRight size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardCompleted]}>
              <View style={styles.statIconContainer}>
                <CheckCircle2 size={18} color={Colors.dark.success} />
              </View>
              <Text style={styles.statValue}>{brief.tasksCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, styles.statCardScheduled]}>
              <View style={styles.statIconContainer}>
                <Clock size={18} color={Colors.dark.info} />
              </View>
              <Text style={styles.statValue}>{brief.tasksScheduled}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={[styles.statCard, styles.statCardUrgent]}>
              <View style={styles.statIconContainer}>
                <Mail size={18} color={Colors.dark.error} />
              </View>
              <Text style={styles.statValue}>{brief.urgentEmails}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={18} color={Colors.dark.accent} />
              <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
            </View>
            <View style={styles.meetingsContainer}>
              {brief.upcomingMeetings.map((meeting, index) => (
                <View
                  key={meeting.id}
                  style={[
                    styles.meetingCard,
                    index === 0 && styles.meetingCardFirst,
                  ]}
                >
                  <View style={styles.meetingTime}>
                    <Text style={styles.meetingTimeText}>{meeting.time}</Text>
                    <Text style={styles.meetingDuration}>{meeting.duration}</Text>
                  </View>
                  <View style={styles.meetingDivider} />
                  <View style={styles.meetingDetails}>
                    <Text style={styles.meetingTitle}>{meeting.title}</Text>
                    <View style={styles.meetingMeta}>
                      <Users size={12} color={Colors.dark.textMuted} />
                      <Text style={styles.meetingAttendees}>
                        {meeting.attendees} attendees
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={18} color={Colors.dark.accent} />
              <Text style={styles.sectionTitle}>Today&apos;s Highlights</Text>
            </View>
            <View style={styles.highlightsContainer}>
              {brief.todayHighlights.map((highlight, index) => (
                <View key={index} style={styles.highlightItem}>
                  <View style={styles.highlightDot} />
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.commandPrompt}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(main)/command');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.commandPromptText}>What do you need done?</Text>
            <ChevronRight size={20} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.warningMuted,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.2)',
  },
  pendingIcon: {
    marginRight: 12,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  statCardCompleted: {},
  statCardScheduled: {},
  statCardUrgent: {},
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  meetingsContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    overflow: 'hidden',
  },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.borderLight,
  },
  meetingCardFirst: {
    borderTopWidth: 0,
  },
  meetingTime: {
    width: 70,
  },
  meetingTimeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  meetingDuration: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  meetingDivider: {
    width: 2,
    height: 36,
    backgroundColor: Colors.dark.accent,
    borderRadius: 1,
    marginHorizontal: 16,
  },
  meetingDetails: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
  meetingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  meetingAttendees: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  highlightsContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
    marginTop: 6,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  commandPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  commandPromptText: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    fontWeight: '500' as const,
  },
});
