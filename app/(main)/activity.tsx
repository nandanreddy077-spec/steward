import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Mail,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';

const DOMAIN_ICONS = {
  calendar: Calendar,
  email: Mail,
  booking: Utensils,
};

const STATUS_COLORS = {
  success: Colors.dark.success,
  failed: Colors.dark.error,
  pending: Colors.dark.warning,
};

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { activity } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return CheckCircle2;
      case 'failed':
        return XCircle;
      default:
        return Clock;
    }
  };

  const groupedActivity = activity.reduce((groups, entry) => {
    const date = new Date(entry.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, typeof activity>);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Log</Text>
        <Text style={styles.subtitle}>
          Complete audit trail of all actions
        </Text>
      </View>

      <ScrollView
        style={styles.activityList}
        contentContainerStyle={styles.activityListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
          />
        }
      >
        {activity.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Clock size={32} color={Colors.dark.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptySubtitle}>
              Your task history will appear here
            </Text>
          </View>
        ) : (
          Object.entries(groupedActivity).map(([date, entries]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              <View style={styles.entriesContainer}>
                {entries.map((entry, index) => {
                  const DomainIcon = DOMAIN_ICONS[entry.domain];
                  const StatusIcon = getStatusIcon(entry.status);
                  const statusColor = STATUS_COLORS[entry.status];

                  return (
                    <View key={entry.id} style={styles.entryCard}>
                      <View style={styles.entryTimeline}>
                        <View
                          style={[
                            styles.entryDot,
                            { backgroundColor: statusColor },
                          ]}
                        />
                        {index < entries.length - 1 && (
                          <View style={styles.entryLine} />
                        )}
                      </View>

                      <View style={styles.entryContent}>
                        <View style={styles.entryHeader}>
                          <View style={styles.entryIcons}>
                            <View
                              style={[
                                styles.domainIconContainer,
                                { backgroundColor: `${statusColor}20` },
                              ]}
                            >
                              <DomainIcon size={14} color={statusColor} />
                            </View>
                          </View>
                          <Text style={styles.entryTime}>
                            {formatTimestamp(entry.timestamp)}
                          </Text>
                        </View>

                        <Text style={styles.entryDescription}>
                          {entry.description}
                        </Text>

                        <View style={styles.entryStatus}>
                          <StatusIcon size={12} color={statusColor} />
                          <Text style={[styles.entryStatusText, { color: statusColor }]}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  activityList: {
    flex: 1,
  },
  activityListContent: {
    padding: 20,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  entriesContainer: {},
  entryCard: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  entryTimeline: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  entryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  entryLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.dark.borderLight,
    marginTop: 4,
  },
  entryContent: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  entryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTime: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  entryDescription: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 20,
  },
  entryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  entryStatusText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
});
