import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Calendar,
  Mail,
  Utensils,
  RefreshCw,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/store/AppContext';
import Colors from '@/constants/colors';
import { Task, TaskStatus } from '@/types';

type FilterType = 'all' | 'pending' | 'active' | 'completed';

const DOMAIN_ICONS = {
  calendar: Calendar,
  email: Mail,
  booking: Utensils,
};

const STATUS_CONFIG: Record<TaskStatus, { color: string; icon: typeof Clock; label: string }> = {
  pending_approval: { color: Colors.dark.warning, icon: AlertCircle, label: 'Awaiting Approval' },
  approved: { color: Colors.dark.info, icon: Clock, label: 'Approved' },
  executing: { color: Colors.dark.info, icon: Loader2, label: 'Executing' },
  completed: { color: Colors.dark.success, icon: CheckCircle2, label: 'Completed' },
  failed: { color: Colors.dark.error, icon: XCircle, label: 'Failed' },
  cancelled: { color: Colors.dark.textMuted, icon: XCircle, label: 'Cancelled' },
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, pendingTasks, activeTasks, completedTasks, retryTask } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getFilteredTasks = (): Task[] => {
    switch (filter) {
      case 'pending':
        return pendingTasks;
      case 'active':
        return activeTasks;
      case 'completed':
        return completedTasks;
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleTaskPress = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (task.status === 'pending_approval') {
      router.push(`/approval/${task.id}`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.subtitle}>
          {tasks.length} total • {pendingTasks.length} pending
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'all' as FilterType, label: 'All', count: tasks.length },
            { key: 'pending' as FilterType, label: 'Pending', count: pendingTasks.length },
            { key: 'active' as FilterType, label: 'Active', count: activeTasks.length },
            { key: 'completed' as FilterType, label: 'Done', count: completedTasks.length },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(item.key);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.filterChipBadge,
                  filter === item.key && styles.filterChipBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipBadgeText,
                    filter === item.key && styles.filterChipBadgeTextActive,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.taskList}
        contentContainerStyle={styles.taskListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
          />
        }
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckCircle2 size={32} color={Colors.dark.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No tasks</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'Create a task using the Command tab'
                : `No ${filter} tasks at the moment`}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.status];
            const StatusIcon = statusConfig.icon;
            const DomainIcon = DOMAIN_ICONS[task.parsedIntent.domain];
            const isPending = task.status === 'pending_approval';

            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, isPending && styles.taskCardPending]}
                onPress={() => handleTaskPress(task)}
                activeOpacity={isPending ? 0.7 : 1}
                disabled={!isPending}
              >
                <View style={styles.taskHeader}>
                  <View
                    style={[
                      styles.taskDomainIcon,
                      { backgroundColor: `${statusConfig.color}20` },
                    ]}
                  >
                    <DomainIcon size={16} color={statusConfig.color} />
                  </View>
                  <View style={styles.taskMeta}>
                    <View style={styles.taskStatusRow}>
                      <StatusIcon size={14} color={statusConfig.color} />
                      <Text style={[styles.taskStatus, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                    <Text style={styles.taskTime}>{formatTime(task.createdAt)}</Text>
                  </View>
                  {isPending && (
                    <ChevronRight size={18} color={Colors.dark.textMuted} />
                  )}
                </View>

                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.parsedIntent.description}
                </Text>

                <Text style={styles.taskCommand} numberOfLines={1}>
                  {`"${task.rawCommand}"`}
                </Text>

                {task.status === 'completed' && task.result?.success && task.result?.safetyReasons && task.result.safetyReasons.length > 0 && (
                  <View style={styles.safetySection}>
                    <View style={styles.safetyHeader}>
                      <Shield size={14} color={Colors.dark.success} />
                      <Text style={styles.safetyTitle}>Why this was safe</Text>
                    </View>
                    <View style={styles.safetyReasons}>
                      {task.result.safetyReasons.map((reason, index) => (
                        <View key={index} style={styles.safetyReasonItem}>
                          <View style={styles.safetyBullet} />
                          <Text style={styles.safetyReasonText}>{reason}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {task.result && (
                  <View
                    style={[
                      styles.taskResult,
                      { backgroundColor: task.result.success ? Colors.dark.successMuted : Colors.dark.errorMuted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.taskResultText,
                        { color: task.result.success ? Colors.dark.success : Colors.dark.error },
                      ]}
                    >
                      {task.result.message}
                    </Text>
                  </View>
                )}

                {task.status === 'failed' && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      retryTask(task.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={14} color={Colors.dark.info} />
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
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
    paddingBottom: 16,
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
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderLight,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.dark.background,
  },
  filterChipBadge: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterChipBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.textMuted,
  },
  filterChipBadgeTextActive: {
    color: Colors.dark.background,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    padding: 20,
    gap: 12,
  },
  taskCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  taskCardPending: {
    borderColor: Colors.dark.warning,
    borderWidth: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDomainIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskMeta: {
    flex: 1,
    marginLeft: 12,
  },
  taskStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskStatus: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  taskTime: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  taskDescription: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  taskCommand: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  taskResult: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  taskResultText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.info,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  safetySection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  safetyReasons: {
    gap: 6,
  },
  safetyReasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  safetyBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.success,
    marginTop: 6,
  },
  safetyReasonText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});
