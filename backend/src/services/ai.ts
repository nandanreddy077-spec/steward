import OpenAI from 'openai';
import { ParsedIntent } from '../types';

// Lazy-load OpenAI client to ensure env vars are loaded
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({ apiKey });
}

export async function parseCommand(command: string): Promise<ParsedIntent> {
  const prompt = `You are an AI assistant that parses user commands into structured intents for a personal assistant app.

Parse this command: "${command}"

Return a JSON object with:
- action: specific action (e.g., "cancel_meeting", "reschedule_meeting", "send_email", "book_restaurant", "summarize_inbox", "block_time")
- domain: "calendar", "email", or "booking"
- entities: object with extracted info (time, date, people, location, meetingTitle, etc.)
- urgency: "low", "medium", or "high"
- isReversible: boolean (can this action be undone easily?)
- description: human-readable description of what will happen
- confidence: 0-1 score of how confident you are in this parsing

Example for "Move my 3pm meeting to tomorrow":
{
  "action": "reschedule_meeting",
  "domain": "calendar",
  "entities": {
    "time": "3pm",
    "date": "tomorrow",
    "originalTime": "3pm"
  },
  "urgency": "medium",
  "isReversible": true,
  "description": "Reschedule 3pm meeting to tomorrow",
  "confidence": 0.95
}

Example for "Book a dinner for 2 at 8pm tonight":
{
  "action": "book_restaurant",
  "domain": "booking",
  "entities": {
    "time": "8pm",
    "date": "today",
    "partySize": 2,
    "type": "dinner"
  },
  "urgency": "medium",
  "isReversible": false,
  "description": "Book dinner reservation for 2 people at 8pm tonight",
  "confidence": 0.9
}

Return ONLY valid JSON, no markdown, no explanation.`;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        {
          role: 'system',
          content: 'You are a command parser. Always return valid JSON only, no markdown, no code blocks.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from AI');

    const parsed = JSON.parse(content) as ParsedIntent;
    
    // Validate and ensure all required fields
    return {
      action: parsed.action || 'unknown',
      domain: parsed.domain || 'calendar',
      entities: parsed.entities || {},
      urgency: parsed.urgency || 'medium',
      isReversible: parsed.isReversible ?? true,
      description: parsed.description || command,
      confidence: parsed.confidence ?? 0.5,
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    // Fallback to basic parsing
    return fallbackParse(command);
  }
}

function fallbackParse(command: string): ParsedIntent {
  const lower = command.toLowerCase();
  let domain: 'calendar' | 'email' | 'booking' = 'calendar';
  let action = 'unknown';
  const entities: Record<string, any> = {};

  // Detect domain
  if (lower.includes('email') || lower.includes('inbox') || lower.includes('mail')) {
    domain = 'email';
    if (lower.includes('summarize') || lower.includes('summary')) {
      action = 'summarize_inbox';
    } else if (lower.includes('send') || lower.includes('reply')) {
      action = 'send_email';
    } else {
      action = 'summarize_inbox';
    }
  } else if (lower.includes('book') || lower.includes('reserve') || lower.includes('restaurant') || lower.includes('dinner')) {
    domain = 'booking';
    action = 'book_restaurant';
    const peopleMatch = command.match(/(\d+)\s*(?:people|guests|persons|for)/i);
    if (peopleMatch) entities.partySize = parseInt(peopleMatch[1]);
  } else {
    domain = 'calendar';
    if (lower.includes('cancel')) {
      action = 'cancel_meeting';
    } else if (lower.includes('reschedule') || lower.includes('move')) {
      action = 'reschedule_meeting';
    } else if (lower.includes('block') || lower.includes('focus')) {
      action = 'block_time';
    } else {
      action = 'schedule_meeting';
    }
  }

  // Extract time
  const timeMatch = command.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (timeMatch) entities.time = timeMatch[1];

  // Extract date
  const dateMatch = command.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (dateMatch) entities.date = dateMatch[1];

  return {
    action,
    domain,
    entities,
    urgency: lower.includes('urgent') || lower.includes('asap') ? 'high' : 'medium',
    isReversible: !lower.includes('cancel') && !lower.includes('send') && domain !== 'booking',
    description: command,
    confidence: 0.5,
  };
}

export function requiresApproval(intent: ParsedIntent): boolean {
  // High-risk actions need approval
  if (intent.action === 'cancel_meeting') return true;
  if (intent.action === 'send_email') return true;
  if (intent.domain === 'booking') return true;
  if (!intent.isReversible) return true;
  if (intent.confidence < 0.7) return true;
  
  return false;
}

export function generatePreview(intent: ParsedIntent, rawCommand: string) {
  const changes: Array<{
    type: 'create' | 'update' | 'delete' | 'send';
    entity: string;
    detail: string;
  }> = [];
  const warnings: string[] = [];

  switch (intent.action) {
    case 'cancel_meeting':
      changes.push({
        type: 'delete',
        entity: 'Meeting',
        detail: `Cancel ${intent.entities.date || 'scheduled'} meeting${intent.entities.time ? ` at ${intent.entities.time}` : ''}`,
      });
      warnings.push('This action cannot be undone. Attendees will be notified.');
      break;

    case 'reschedule_meeting':
      changes.push({
        type: 'update',
        entity: 'Meeting',
        detail: `Move meeting to ${intent.entities.date || 'new date'}${intent.entities.time ? ` at ${intent.entities.time}` : ''}`,
      });
      warnings.push('Attendees will receive an updated invitation.');
      break;

    case 'schedule_meeting':
      changes.push({
        type: 'create',
        entity: 'Meeting',
        detail: `Create meeting${intent.entities.date ? ` on ${intent.entities.date}` : ''}${intent.entities.time ? ` at ${intent.entities.time}` : ''}`,
      });
      break;

    case 'block_time':
      changes.push({
        type: 'create',
        entity: 'Calendar Block',
        detail: `Block focus time${intent.entities.date ? ` on ${intent.entities.date}` : ''}${intent.entities.time ? ` at ${intent.entities.time}` : ''}`,
      });
      break;

    case 'send_email':
      changes.push({
        type: 'send',
        entity: 'Email',
        detail: 'Send email to recipient',
      });
      warnings.push('This action cannot be undone once sent.');
      break;

    case 'book_restaurant':
      changes.push({
        type: 'create',
        entity: 'Reservation',
        detail: `Book table${intent.entities.partySize ? ` for ${intent.entities.partySize} people` : ''}${intent.entities.time ? ` at ${intent.entities.time}` : ''}`,
      });
      warnings.push('Cancellation policy may apply.');
      break;

    default:
      changes.push({
        type: 'create',
        entity: intent.domain.charAt(0).toUpperCase() + intent.domain.slice(1),
        detail: intent.description,
      });
  }

  return {
    title: intent.description,
    description: rawCommand,
    changes,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

