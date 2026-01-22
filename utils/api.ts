import { Platform } from 'react-native';

// API Base URL Configuration
// For production, set EXPO_PUBLIC_API_URL environment variable
// Example: EXPO_PUBLIC_API_URL=https://your-app.up.railway.app/api
const getApiBaseUrl = () => {
  // Check for production API URL from environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // For mobile devices/simulators, use your local network IP
    // For web, use localhost
    // You can also use Expo's tunnel: expo start --tunnel
    return Platform.OS === 'web' 
      ? 'http://localhost:3001/api'
      : 'http://192.168.0.103:3001/api'; // Replace with your local IP
  }
  
  // Fallback for production (should be set via EXPO_PUBLIC_API_URL)
  return 'https://your-app-name.up.railway.app/api'; // Update this with your Railway URL
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network error' };
  }
}

// Task API
export const taskAPI = {
  parse: async (command: string, userId?: string) => {
    return fetchAPI<{
      intent: any;
      requiresApproval: boolean;
      preview?: any;
    }>('/tasks/parse', {
      method: 'POST',
      body: JSON.stringify({ command, userId }),
    });
  },

  create: async (userId: string, command: string, intent: any, requiresApproval: boolean, preview?: any) => {
    return fetchAPI<{ task: any }>('/tasks/create', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        command,
        intent,
        requiresApproval,
        preview,
      }),
    });
  },

  execute: async (taskId: string, userId: string) => {
    return fetchAPI<{ success: boolean; message: string }>('/tasks/execute', {
      method: 'POST',
      body: JSON.stringify({ taskId, userId }),
    });
  },

  approve: async (taskId: string, userId: string, selectedEmailId?: string) => {
    return fetchAPI<{ task: any }>('/tasks/approve', {
      method: 'POST',
      body: JSON.stringify({ taskId, userId, selectedEmailId }),
    });
  },

  reject: async (taskId: string, userId: string) => {
    return fetchAPI<{ task: any }>('/tasks/reject', {
      method: 'POST',
      body: JSON.stringify({ taskId, userId }),
    });
  },

  getUserTasks: async (userId: string) => {
    return fetchAPI<{ tasks: any[] }>(`/tasks/user/${userId}`);
  },
};

// Auth API
export const authAPI = {
  getGoogleAuthUrl: async () => {
    return fetchAPI<{ authUrl: string }>('/auth/google');
  },
  
  getGoogleCallback: async (code: string) => {
    return fetchAPI<{
      success: boolean;
      user: {
        id: string;
        email: string;
        name?: string;
      };
      tokens: {
        access_token: string;
        refresh_token?: string;
        expiry_date?: number;
      };
    }>(`/auth/google/callback?code=${encodeURIComponent(code)}`);
  },

  getUser: async (userId: string) => {
    return fetchAPI<{
      user: {
        id: string;
        email: string;
        name?: string;
        hasGoogleTokens: boolean;
      };
    }>(`/auth/user/${userId}`);
  },
};

// Calendar API
export const calendarAPI = {
  getEvents: async (userId: string) => {
    return fetchAPI<{ events: any[] }>(`/calendar/events?userId=${userId}`);
  },

  createEvent: async (userId: string, summary: string, startTime: string, endTime: string, description?: string) => {
    return fetchAPI<{ event: any }>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        summary,
        startTime,
        endTime,
        description,
      }),
    });
  },
};
