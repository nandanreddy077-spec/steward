import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Task, User, ActivityLogEntry, DailyBrief, UserSettings, TaskStatus } from '@/types';
import { parseCommand, requiresApproval, generatePreview } from '@/utils/taskParser';

const STORAGE_KEYS = {
  USER: 'chief_user',
  TASKS: 'chief_tasks',
  ACTIVITY: 'chief_activity',
  SETTINGS: 'chief_settings',
  ONBOARDED: 'chief_onboarded',
};

const defaultSettings: UserSettings = {
  autoApproveReminders: true,
  autoApproveCalendarBlocks: true,
  autoApproveSummaries: true,
  notificationsEnabled: true,
  emailConnected: false,
  calendarConnected: false,
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) as User : null;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (!stored) return [];
      const tasks = JSON.parse(stored) as Task[];
      return tasks.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        executedAt: t.executedAt ? new Date(t.executedAt) : undefined,
      }));
    },
  });

  const activityQuery = useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (!stored) return [];
      const activity = JSON.parse(stored) as ActivityLogEntry[];
      return activity.map(a => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) as UserSettings : defaultSettings;
    },
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED).then(val => {
      setHasOnboarded(val === 'true');
    });
  }, []);

  useEffect(() => {
    if (userQuery.data) {
      setIsAuthenticated(true);
    }
  }, [userQuery.data]);

  const loginMutation = useMutation({
    mutationFn: async (user: User) => {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user);
      setIsAuthenticated(true);
      setHasOnboarded(true);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TASKS, STORAGE_KEYS.ACTIVITY]);
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null);
      queryClient.setQueryData(['tasks'], []);
      queryClient.setQueryData(['activity'], []);
      setIsAuthenticated(false);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (command: string) => {
      const intent = parseCommand(command);
      const needsApproval = requiresApproval(intent);
      const preview = needsApproval ? generatePreview(intent, command) : undefined;
      
      const task: Task = {
        id: generateId(),
        rawCommand: command,
        parsedIntent: intent,
        status: needsApproval ? 'pending_approval' : 'executing',
        requiresApproval: needsApproval,
        createdAt: new Date(),
        updatedAt: new Date(),
        preview,
      };

      const currentTasks = tasksQuery.data || [];
      const updatedTasks = [task, ...currentTasks];
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

      const logEntry: ActivityLogEntry = {
        id: generateId(),
        taskId: task.id,
        action: 'task_created',
        description: `Task created: ${intent.description}`,
        timestamp: new Date(),
        domain: intent.domain,
        status: 'pending',
      };

      const currentActivity = activityQuery.data || [];
      const updatedActivity = [logEntry, ...currentActivity];
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updatedActivity));

      return { task, activity: logEntry };
    },
    onSuccess: ({ task, activity }) => {
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => [task, ...(old || [])]);
      queryClient.setQueryData(['activity'], (old: ActivityLogEntry[] | undefined) => [activity, ...(old || [])]);
      
      if (!task.requiresApproval) {
        setTimeout(() => executeTask(task.id), 1500);
      }
    },
  });

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus, result?: { success: boolean; message: string }) => {
    const currentTasks = tasksQuery.data || [];
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          updatedAt: new Date(),
          executedAt: status === 'completed' || status === 'failed' ? new Date() : t.executedAt,
          result,
        };
      }
      return t;
    });
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    queryClient.setQueryData(['tasks'], updatedTasks);

    const task = currentTasks.find(t => t.id === taskId);
    if (task) {
      const logEntry: ActivityLogEntry = {
        id: generateId(),
        taskId,
        action: `task_${status}`,
        description: `${task.parsedIntent.description}: ${status}`,
        timestamp: new Date(),
        domain: task.parsedIntent.domain,
        status: status === 'completed' ? 'success' : status === 'failed' ? 'failed' : 'pending',
      };

      const currentActivity = activityQuery.data || [];
      const updatedActivity = [logEntry, ...currentActivity];
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updatedActivity));
      queryClient.setQueryData(['activity'], updatedActivity);
    }
  }, [tasksQuery.data, activityQuery.data, queryClient]);

  const executeTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'executing');
    
    setTimeout(async () => {
      const success = Math.random() > 0.1;
      await updateTaskStatus(taskId, success ? 'completed' : 'failed', {
        success,
        message: success ? 'Task completed successfully' : 'Task execution failed. Queued for manual review.',
      });
    }, 2000 + Math.random() * 1500);
  }, [updateTaskStatus]);

  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await updateTaskStatus(taskId, 'approved');
      setTimeout(() => executeTask(taskId), 500);
      return taskId;
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await updateTaskStatus(taskId, 'cancelled');
      return taskId;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const current = settingsQuery.data || defaultSettings;
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
    },
  });

  const getDailyBrief = useCallback((): DailyBrief => {
    const tasks = tasksQuery.data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    return {
      date: new Date(),
      tasksCompleted: todayTasks.filter(t => t.status === 'completed').length,
      tasksScheduled: todayTasks.filter(t => t.status === 'executing' || t.status === 'approved').length,
      tasksPendingApproval: tasks.filter(t => t.status === 'pending_approval').length,
      upcomingMeetings: [
        { id: '1', title: 'Team Standup', time: '9:00 AM', duration: '30 min', attendees: 5 },
        { id: '2', title: 'Product Review', time: '11:00 AM', duration: '1 hr', attendees: 8 },
        { id: '3', title: 'Client Call', time: '2:30 PM', duration: '45 min', attendees: 3 },
      ],
      urgentEmails: 4,
      todayHighlights: [
        'Q4 planning deck due at 5pm',
        '2 contracts pending signature',
        'New investor intro scheduled',
      ],
    };
  }, [tasksQuery.data]);

  return {
    user: userQuery.data,
    tasks: tasksQuery.data || [],
    activity: activityQuery.data || [],
    settings: settingsQuery.data || defaultSettings,
    isAuthenticated,
    hasOnboarded,
    isLoading: userQuery.isLoading || tasksQuery.isLoading,
    
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    createTask: createTaskMutation.mutate,
    approveTask: approveTaskMutation.mutate,
    rejectTask: rejectTaskMutation.mutate,
    updateSettings: updateSettingsMutation.mutate,
    getDailyBrief,
    
    pendingTasks: (tasksQuery.data || []).filter(t => t.status === 'pending_approval'),
    activeTasks: (tasksQuery.data || []).filter(t => t.status === 'executing' || t.status === 'approved'),
    completedTasks: (tasksQuery.data || []).filter(t => t.status === 'completed' || t.status === 'failed'),
  };
});
