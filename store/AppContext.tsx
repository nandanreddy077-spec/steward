import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Task, User, ActivityLogEntry, DailyBrief, UserSettings, TaskStatus } from '@/types';
import { parseCommand, requiresApproval, generatePreview } from '@/utils/taskParser';
import { taskAPI } from '@/utils/api';
import { getUserFriendlyError, isRetryableError } from '@/utils/errorMessages';
import { sanitizeCommand, validateCommand } from '@/utils/validation';

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

  // Sync tasks from database when user is authenticated (only once on mount/login)
  useEffect(() => {
    const syncTasks = async () => {
      if (userQuery.data?.id && userQuery.data.id !== 'local_user') {
        try {
          const result = await taskAPI.getUserTasks(userQuery.data.id);
          if (result.data?.tasks) {
            // Convert database tasks to frontend Task format
            const dbTasks: Task[] = result.data.tasks.map((dbTask: any) => ({
              id: dbTask.id,
              rawCommand: dbTask.raw_command,
              parsedIntent: dbTask.parsed_intent,
              status: (dbTask.status === 'pending_approval' ? 'pending_approval' :
                       dbTask.status === 'executing' ? 'executing' :
                       dbTask.status === 'completed' ? 'completed' :
                       dbTask.status === 'failed' ? 'failed' :
                       dbTask.status === 'cancelled' ? 'cancelled' : 'pending_approval') as TaskStatus,
              requiresApproval: dbTask.requires_approval,
              createdAt: new Date(dbTask.created_at),
              updatedAt: new Date(dbTask.updated_at),
              executedAt: dbTask.executed_at ? new Date(dbTask.executed_at) : undefined,
              preview: dbTask.preview,
              result: dbTask.result,
            }));
            
            // Get current local tasks
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
            const localTasks = stored ? JSON.parse(stored) as Task[] : [];
            
            // Merge with local tasks (database takes precedence)
            const mergedTasks = [...dbTasks];
            
            // Add local-only tasks (those not in database)
            localTasks.forEach((localTask: Task) => {
              if (!dbTasks.find(dbTask => dbTask.id === localTask.id)) {
                mergedTasks.push({
                  ...localTask,
                  createdAt: new Date(localTask.createdAt),
                  updatedAt: new Date(localTask.updatedAt),
                  executedAt: localTask.executedAt ? new Date(localTask.executedAt) : undefined,
                });
              }
            });
            
            // Sort by created date (newest first)
            mergedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            
            await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mergedTasks));
            queryClient.setQueryData(['tasks'], mergedTasks);
          }
        } catch (error) {
          console.warn('Failed to sync tasks from database:', error);
        }
      }
    };
    
    syncTasks();
  }, [userQuery.data?.id]); // Only sync when user ID changes (on login)

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
      // Validate and sanitize command
      const validation = validateCommand(command);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid command');
      }
      
      const sanitized = sanitizeCommand(command);
      const userId = userQuery.data?.id || 'local_user';
      
      // Try backend API first, fallback to local parsing
      let intent, needsApproval, preview;
      
      try {
        // Pass userId to parse endpoint so it can draft email replies with context
        const parseResult = await taskAPI.parse(sanitized, userId);
        if (parseResult.data) {
          intent = parseResult.data.intent;
          needsApproval = parseResult.data.requiresApproval;
          preview = parseResult.data.preview;
        } else {
          // Fallback to local parsing
          intent = parseCommand(sanitized);
          needsApproval = requiresApproval(intent);
          preview = needsApproval ? generatePreview(intent, sanitized) : undefined;
        }
      } catch (error) {
        console.warn('Backend API unavailable, using local parsing:', error);
        // Fallback to local parsing
        intent = parseCommand(sanitized);
        needsApproval = requiresApproval(intent);
        preview = needsApproval ? generatePreview(intent, sanitized) : undefined;
      }
      
      // Try to save to backend first to get the real task ID
      let backendTask: any = null;
      let taskId: string;
      
      try {
        if (userQuery.data?.id) {
          const createResult = await taskAPI.create(userId, sanitized, intent, needsApproval, preview);
          if (createResult.data?.task) {
            backendTask = createResult.data.task;
            taskId = backendTask.id; // Use backend-generated ID
          } else {
            // Backend failed, use local ID
            taskId = generateId();
          }
        } else {
          // No user, use local ID
          taskId = generateId();
        }
      } catch (error) {
        console.warn('Failed to save to backend, using local storage:', error);
        taskId = generateId();
      }

      // Create task object - use backend task data if available, otherwise create local task
      const task: Task = backendTask ? {
        id: backendTask.id,
        rawCommand: backendTask.raw_command || sanitized,
        parsedIntent: backendTask.parsed_intent || intent,
        status: (backendTask.status === 'pending_approval' ? 'pending_approval' : 
                 backendTask.status === 'executing' ? 'executing' : 
                 backendTask.status === 'completed' ? 'completed' : 
                 backendTask.status === 'failed' ? 'failed' : 
                 'pending_approval') as TaskStatus,
        requiresApproval: backendTask.requires_approval || needsApproval,
        createdAt: backendTask.created_at ? new Date(backendTask.created_at) : new Date(),
        updatedAt: backendTask.updated_at ? new Date(backendTask.updated_at) : new Date(),
        preview: backendTask.preview || preview,
      } : {
        id: taskId,
        rawCommand: sanitized,
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
      // Update cache directly instead of invalidating to prevent tasks from disappearing
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        const existing = old || [];
        // Check if task already exists to avoid duplicates
        if (existing.find(t => t.id === task.id)) {
          return existing;
        }
        return [task, ...existing];
      });
      queryClient.setQueryData(['activity'], (old: ActivityLogEntry[] | undefined) => [activity, ...(old || [])]);
      
      if (!task.requiresApproval) {
        setTimeout(() => executeTask(task.id), 1500);
      }
    },
  });

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus, result?: { success: boolean; message: string; safetyReasons?: string[] }) => {
    const currentTasks = tasksQuery.data || [];
    let updatedTasks = currentTasks.map(t => {
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
    
    // If task not found in current tasks, it might be a new task from database
    // Try to fetch it from database if user is authenticated
    if (!updatedTasks.find(t => t.id === taskId) && userQuery.data?.id) {
      try {
        const syncResult = await taskAPI.getUserTasks(userQuery.data.id);
        if (syncResult.data?.tasks) {
          const dbTask = syncResult.data.tasks.find((t: any) => t.id === taskId);
          if (dbTask) {
            // Convert database task to frontend Task format
            const frontendTask: Task = {
              id: dbTask.id,
              rawCommand: dbTask.raw_command,
              parsedIntent: dbTask.parsed_intent,
              status: (dbTask.status === 'pending_approval' ? 'pending_approval' :
                       dbTask.status === 'executing' ? 'executing' :
                       dbTask.status === 'completed' ? 'completed' :
                       dbTask.status === 'failed' ? 'failed' :
                       dbTask.status === 'cancelled' ? 'cancelled' : 'pending_approval') as TaskStatus,
              requiresApproval: dbTask.requires_approval,
              createdAt: new Date(dbTask.created_at),
              updatedAt: new Date(dbTask.updated_at),
              executedAt: dbTask.executed_at ? new Date(dbTask.executed_at) : undefined,
              preview: dbTask.preview,
              result: dbTask.result,
            };
            updatedTasks = [frontendTask, ...updatedTasks];
          }
        }
      } catch (error) {
        console.warn('Failed to sync task from database:', error);
      }
    }
    
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
    
    const userId = userQuery.data?.id;
    
    if (!userId) {
      await updateTaskStatus(taskId, 'failed', {
        success: false,
        message: getUserFriendlyError('User not authenticated. Please log in.'),
      });
      return;
    }
    
    try {
      // Execute via backend API
      const result = await taskAPI.execute(taskId, userId);
      
      // After execution, sync task from database to get latest status and result
      try {
        const syncResult = await taskAPI.getUserTasks(userId);
        if (syncResult.data?.tasks) {
          const dbTask = syncResult.data.tasks.find((t: any) => t.id === taskId);
          if (dbTask) {
            // Convert database task to frontend Task format
            const frontendTask: Task = {
              id: dbTask.id,
              rawCommand: dbTask.raw_command,
              parsedIntent: dbTask.parsed_intent,
              status: (dbTask.status === 'pending_approval' ? 'pending_approval' :
                       dbTask.status === 'executing' ? 'executing' :
                       dbTask.status === 'completed' ? 'completed' :
                       dbTask.status === 'failed' ? 'failed' :
                       dbTask.status === 'cancelled' ? 'cancelled' : 'pending_approval') as TaskStatus,
              requiresApproval: dbTask.requires_approval,
              createdAt: new Date(dbTask.created_at),
              updatedAt: new Date(dbTask.updated_at),
              executedAt: dbTask.executed_at ? new Date(dbTask.executed_at) : undefined,
              preview: dbTask.preview,
              result: dbTask.result,
            };
            
            // Update AsyncStorage and cache
            const currentTasks = tasksQuery.data || [];
            const existingIndex = currentTasks.findIndex(t => t.id === taskId);
            let updatedTasks: Task[];
            
            if (existingIndex >= 0) {
              updatedTasks = [...currentTasks];
              updatedTasks[existingIndex] = frontendTask;
            } else {
              updatedTasks = [frontendTask, ...currentTasks];
            }
            
            await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
            queryClient.setQueryData(['tasks'], updatedTasks);
            return; // Exit early, task already synced
          }
        }
      } catch (syncError) {
        console.warn('Failed to sync task from database, using API result:', syncError);
      }
      
      // Fallback: use API result if sync failed
      if (result.data?.success) {
        const resultData = (result.data as any)?.result;
        await updateTaskStatus(taskId, 'completed', {
          success: true,
          message: resultData?.message || 'Task completed successfully',
          safetyReasons: resultData?.safetyReasons, // Preserve safety reasons from backend
        });
      } else if (result.error) {
        throw new Error(result.error);
      } else {
        // Backend returned but success is false
        const resultData = (result.data as any)?.result;
        await updateTaskStatus(taskId, 'failed', {
          success: false,
          message: getUserFriendlyError(resultData?.message || 'Task execution failed'),
        });
      }
    } catch (error: any) {
      console.error('Task execution error:', error);
      const friendlyMessage = getUserFriendlyError(error);
      await updateTaskStatus(taskId, 'failed', {
        success: false,
        message: friendlyMessage,
      });
    }
  }, [updateTaskStatus, userQuery.data, tasksQuery.data, queryClient]);

  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const userId = userQuery.data?.id || 'local_user';
      
      // Get task to check for selectedEmailId
      const task = tasksQuery.data?.find(t => t.id === taskId);
      const selectedEmailId = task?.parsedIntent?.entities?.emailId;
      
      // Try backend API first
      try {
        if (userQuery.data?.id) {
          await taskAPI.approve(taskId, userId, selectedEmailId);
        }
      } catch (error) {
        console.warn('Backend approval failed, using local:', error);
      }
      
      await updateTaskStatus(taskId, 'approved');
      setTimeout(() => executeTask(taskId), 500);
      return taskId;
    },
  });

  const rejectTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const userId = userQuery.data?.id || 'local_user';
      
      // Try backend API first
      try {
        if (userQuery.data?.id) {
          await taskAPI.reject(taskId, userId);
        }
      } catch (error) {
        console.warn('Backend rejection failed, using local:', error);
      }
      
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

  const retryTask = useCallback(async (taskId: string) => {
    // Reset task status to pending_approval if it requires approval, otherwise execute directly
    const task = tasksQuery.data?.find(t => t.id === taskId);
    if (!task) return;

    if (task.requiresApproval) {
      await updateTaskStatus(taskId, 'pending_approval');
    } else {
      await executeTask(taskId);
    }
  }, [tasksQuery.data, executeTask, updateTaskStatus]);

  const updateTaskPreview = useCallback(async (taskId: string, preview: any) => {
    const currentTasks = tasksQuery.data || [];
    const taskIndex = currentTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return;
    
    const updatedTasks = [...currentTasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      preview,
    };
    
    // Update local storage
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    
    // Update cache
    queryClient.setQueryData(['tasks'], updatedTasks);
    
    // Also update parsed intent entities if email preview changed
    if (preview.emailPreview) {
      const task = updatedTasks[taskIndex];
      const updatedIntent = {
        ...task.parsedIntent,
        entities: {
          ...task.parsedIntent.entities,
          to: preview.emailPreview.to,
          subject: preview.emailPreview.subject,
          body: preview.emailPreview.body,
        },
      };
      
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        parsedIntent: updatedIntent,
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
      queryClient.setQueryData(['tasks'], updatedTasks);
    }
  }, [tasksQuery.data, queryClient]);

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
    updateTaskPreview,
    retryTask,
    getDailyBrief,
    
    pendingTasks: (tasksQuery.data || []).filter(t => t.status === 'pending_approval'),
    activeTasks: (tasksQuery.data || []).filter(t => t.status === 'executing' || t.status === 'approved'),
    completedTasks: (tasksQuery.data || []).filter(t => t.status === 'completed' || t.status === 'failed'),
  };
});
