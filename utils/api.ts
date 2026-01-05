import { Platform } from 'react-native';

// Use local network IP for mobile devices, localhost for web
// Replace 192.168.0.103 with your actual local IP (run: ifconfig | grep "inet " | grep -v 127.0.0.1)
const getApiBaseUrl = () => {
  if (__DEV__) {
    // For mobile devices/simulators, use your local network IP
    // For web, use localhost
    // You can also use Expo's tunnel: expo start --tunnel
    return Platform.OS === 'web' 
      ? 'http://localhost:3001/api'
      : 'http://192.168.0.103:3001/api'; // Replace with your local IP
  }
  return 'https://your-production-api.com/api'; // Update for production
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  needsReauth?: boolean;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<ApiResponse<T>> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Request failed';
        
        if (response.status === 401 && data.needsReauth) {
          return { error: errorMessage, needsReauth: true } as any;
        }
        
        if (response.status >= 500 && i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        
        return { error: errorMessage };
      }

      return { data };
    } catch (error: any) {
      lastError = error;
      console.error(`API Error (attempt ${i + 1}/${retries}):`, error);
      
      if (error.name === 'AbortError') {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
        return { error: 'Request timeout. Please check your connection.' };
      }
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
    }
  }
  
  return { error: lastError?.message || 'Network error. Please check your connection.' };
}

// Task API
export const taskAPI = {
  parse: async (command: string) => {
    return fetchAPI<{
      intent: any;
      requiresApproval: boolean;
      preview?: any;
    }>('/tasks/parse', {
      method: 'POST',
      body: JSON.stringify({ command }),
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

  approve: async (taskId: string, userId: string) => {
    return fetchAPI<{ task: any }>('/tasks/approve', {
      method: 'POST',
      body: JSON.stringify({ taskId, userId }),
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
