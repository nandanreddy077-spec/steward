import { ParsedIntent, TaskDomain, TaskUrgency, TaskPreview, PreviewChange } from '@/types';

const CALENDAR_KEYWORDS = ['meeting', 'schedule', 'reschedule', 'cancel', 'block', 'calendar', 'appointment', 'call', 'sync'];
const EMAIL_KEYWORDS = ['email', 'inbox', 'reply', 'draft', 'send', 'mail', 'message', 'urgent'];
const BOOKING_KEYWORDS = ['book', 'reserve', 'restaurant', 'dinner', 'lunch', 'flight', 'hotel', 'travel', 'reservation'];

const CANCEL_KEYWORDS = ['cancel', 'delete', 'remove'];
const SEND_KEYWORDS = ['send', 'reply', 'forward'];
const MONEY_KEYWORDS = ['book', 'reserve', 'purchase', 'buy', 'pay'];

export function parseCommand(command: string): ParsedIntent {
  const lowerCommand = command.toLowerCase();
  
  const domain = detectDomain(lowerCommand);
  const action = detectAction(lowerCommand, domain);
  const urgency = detectUrgency(lowerCommand);
  const isReversible = checkReversibility(lowerCommand, domain);
  const entities = extractEntities(command, domain);
  const description = generateDescription(action, domain, entities);
  
  return {
    action,
    domain,
    entities,
    urgency,
    isReversible,
    description,
  };
}

function detectDomain(command: string): TaskDomain {
  const calendarScore = CALENDAR_KEYWORDS.filter(k => command.includes(k)).length;
  const emailScore = EMAIL_KEYWORDS.filter(k => command.includes(k)).length;
  const bookingScore = BOOKING_KEYWORDS.filter(k => command.includes(k)).length;
  
  if (bookingScore > calendarScore && bookingScore > emailScore) return 'booking';
  if (emailScore > calendarScore) return 'email';
  return 'calendar';
}

function detectAction(command: string, domain: TaskDomain): string {
  if (domain === 'calendar') {
    if (command.includes('cancel')) return 'cancel_meeting';
    if (command.includes('reschedule') || command.includes('move')) return 'reschedule_meeting';
    if (command.includes('block') || command.includes('focus')) return 'block_time';
    if (command.includes('remind')) return 'set_reminder';
    return 'schedule_meeting';
  }
  
  if (domain === 'email') {
    if (command.includes('summarize') || command.includes('summary')) return 'summarize_inbox';
    if (command.includes('draft')) return 'draft_reply';
    if (command.includes('send') || command.includes('reply')) return 'send_email';
    if (command.includes('flag') || command.includes('urgent')) return 'flag_urgent';
    return 'summarize_inbox';
  }
  
  if (domain === 'booking') {
    if (command.includes('restaurant') || command.includes('dinner') || command.includes('lunch')) return 'book_restaurant';
    if (command.includes('flight')) return 'search_flights';
    if (command.includes('hotel')) return 'search_hotels';
    return 'book_service';
  }
  
  return 'unknown';
}

function detectUrgency(command: string): TaskUrgency {
  if (command.includes('urgent') || command.includes('asap') || command.includes('now') || command.includes('immediately')) {
    return 'high';
  }
  if (command.includes('today') || command.includes('soon')) {
    return 'medium';
  }
  return 'low';
}

function checkReversibility(command: string, domain: TaskDomain): boolean {
  const hasCancel = CANCEL_KEYWORDS.some(k => command.includes(k));
  const hasSend = SEND_KEYWORDS.some(k => command.includes(k));
  const hasMoney = MONEY_KEYWORDS.some(k => command.includes(k));
  
  if (hasCancel || hasSend || hasMoney) return false;
  if (domain === 'email' && command.includes('send')) return false;
  
  return true;
}

function extractEntities(command: string, domain: TaskDomain): Record<string, string | number | boolean> {
  const entities: Record<string, string | number | boolean> = {};
  
  const timeMatch = command.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (timeMatch) entities.time = timeMatch[1];
  
  const dateMatch = command.match(/(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (dateMatch) entities.date = dateMatch[1];
  
  if (domain === 'booking') {
    const peopleMatch = command.match(/(\d+)\s*(?:people|guests|persons)/i);
    if (peopleMatch) entities.partySize = parseInt(peopleMatch[1]);
  }
  
  return entities;
}

function generateDescription(action: string, domain: TaskDomain, entities: Record<string, string | number | boolean>): string {
  const timeStr = entities.time ? ` at ${entities.time}` : '';
  const dateStr = entities.date ? ` ${entities.date}` : '';
  
  switch (action) {
    case 'cancel_meeting':
      return `Cancel meeting${timeStr}${dateStr}`;
    case 'reschedule_meeting':
      return `Reschedule meeting${timeStr}${dateStr}`;
    case 'schedule_meeting':
      return `Schedule new meeting${timeStr}${dateStr}`;
    case 'block_time':
      return `Block focus time${timeStr}${dateStr}`;
    case 'set_reminder':
      return `Set reminder${timeStr}${dateStr}`;
    case 'summarize_inbox':
      return 'Summarize inbox and flag urgent emails';
    case 'draft_reply':
      return 'Draft reply to email';
    case 'send_email':
      return 'Send email';
    case 'flag_urgent':
      return 'Flag urgent emails';
    case 'book_restaurant':
      return `Book restaurant${timeStr}${dateStr}`;
    case 'search_flights':
      return 'Search for flights';
    case 'search_hotels':
      return 'Search for hotels';
    default:
      return `Process ${domain} task`;
  }
}

export function requiresApproval(intent: ParsedIntent): boolean {
  if (intent.action === 'cancel_meeting') return true;
  if (intent.action === 'send_email') return true;
  if (intent.domain === 'booking') return true;
  if (!intent.isReversible) return true;
  
  return false;
}

export function generatePreview(intent: ParsedIntent, rawCommand: string): TaskPreview {
  const changes: PreviewChange[] = [];
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
