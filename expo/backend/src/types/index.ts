export interface ParsedIntent {
  action: string;
  domain: 'calendar' | 'email' | 'booking';
  entities: Record<string, any>;
  urgency: 'low' | 'medium' | 'high';
  isReversible: boolean;
  description: string;
  confidence: number;
}

export interface TaskPreview {
  title: string;
  description: string;
  changes: PreviewChange[];
  warnings?: string[];
  approvalReasons?: string[];
  emailPreview?: {
    to: string;
    subject: string;
    body: string;
  };
  recentEmails?: Array<{
    id: string;
    from: string;
    fromEmail: string;
    subject: string;
    snippet: string;
    date: string;
  }>;
  selectedEmailId?: string;
}

export interface PreviewChange {
  type: 'create' | 'update' | 'delete' | 'send';
  entity: string;
  detail: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  google_tokens?: GoogleTokens;
  created_at: string;
  updated_at: string;
}





