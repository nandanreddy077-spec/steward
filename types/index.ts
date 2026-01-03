export type TaskDomain = 'calendar' | 'email' | 'booking';
export type TaskStatus = 'pending_approval' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type TaskUrgency = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  rawCommand: string;
  parsedIntent: ParsedIntent;
  status: TaskStatus;
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  result?: TaskResult;
  preview?: TaskPreview;
}

export interface ParsedIntent {
  action: string;
  domain: TaskDomain;
  entities: Record<string, string | number | boolean>;
  urgency: TaskUrgency;
  isReversible: boolean;
  description: string;
}

export interface TaskResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface TaskPreview {
  title: string;
  description: string;
  changes: PreviewChange[];
  warnings?: string[];
}

export interface PreviewChange {
  type: 'create' | 'update' | 'delete' | 'send';
  entity: string;
  detail: string;
}

export interface ActivityLogEntry {
  id: string;
  taskId: string;
  action: string;
  description: string;
  timestamp: Date;
  domain: TaskDomain;
  status: 'success' | 'failed' | 'pending';
}

export interface DailyBrief {
  date: Date;
  tasksCompleted: number;
  tasksScheduled: number;
  tasksPendingApproval: number;
  upcomingMeetings: BriefMeeting[];
  urgentEmails: number;
  todayHighlights: string[];
}

export interface BriefMeeting {
  id: string;
  title: string;
  time: string;
  duration: string;
  attendees: number;
}

export interface UserSettings {
  autoApproveReminders: boolean;
  autoApproveCalendarBlocks: boolean;
  autoApproveSummaries: boolean;
  notificationsEnabled: boolean;
  emailConnected: boolean;
  calendarConnected: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  subscription: 'trial' | 'pro' | 'executive';
  connectedAccounts: {
    google: boolean;
    microsoft: boolean;
  };
}
