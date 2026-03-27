import { google } from 'googleapis';
import { GoogleTokens } from '../types';
import { getValidTokens } from '../utils/tokenRefresh';

export function getCalendarClient(tokens: GoogleTokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Gets calendar client with auto-refreshed tokens
 */
export async function getCalendarClientWithRefresh(
  userId: string,
  tokens: GoogleTokens
) {
  const validTokens = await getValidTokens(userId, tokens);
  return getCalendarClient(validTokens);
}

export async function listEvents(tokens: GoogleTokens, maxResults: number = 10) {
  const calendar = getCalendarClient(tokens);
  const now = new Date();
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

export async function createEvent(
  tokens: GoogleTokens,
  summary: string,
  startTime: string,
  endTime: string,
  description?: string
) {
  const calendar = getCalendarClient(tokens);

  // Use UTC timezone or detect from startTime
  // If startTime is ISO string, it should include timezone info
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime,
      timeZone: timeZone,
    },
    end: {
      dateTime: endTime,
      timeZone: timeZone,
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data;
}

export async function updateEvent(
  tokens: GoogleTokens,
  eventId: string,
  updates: {
    summary?: string;
    start?: string;
    end?: string;
    description?: string;
  }
) {
  const calendar = getCalendarClient(tokens);

  // First get the event
  const event = await calendar.events.get({
    calendarId: 'primary',
    eventId,
  });

  // Update fields
  if (updates.summary) event.data.summary = updates.summary;
  if (updates.description) event.data.description = updates.description;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  if (updates.start) {
    event.data.start = {
      dateTime: updates.start,
      timeZone: event.data.start?.timeZone || timeZone,
    };
  }
  if (updates.end) {
    event.data.end = {
      dateTime: updates.end,
      timeZone: event.data.end?.timeZone || timeZone,
    };
  }

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: event.data,
  });

  return response.data;
}

export async function deleteEvent(tokens: GoogleTokens, eventId: string) {
  const calendar = getCalendarClient(tokens);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });

  return { success: true };
}

export async function findEventByTime(
  tokens: GoogleTokens,
  time: string,
  date?: string
): Promise<any | null> {
  const events = await listEvents(tokens, 50);
  
  // Parse time (e.g., "3pm" -> 15:00)
  const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!timeMatch) return null;

  let hour = parseInt(timeMatch[1]);
  const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const period = timeMatch[3]?.toLowerCase();

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  // Find event matching time
  for (const event of events) {
    if (event.start?.dateTime) {
      const eventDate = new Date(event.start.dateTime);
      if (eventDate.getHours() === hour && eventDate.getMinutes() === minute) {
        return event;
      }
    }
  }

  return null;
}


