import { google } from 'googleapis';
import OpenAI from 'openai';
import { GoogleTokens } from '../types';
import { getValidTokens } from '../utils/tokenRefresh';

export function getGmailClient(tokens: GoogleTokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Gets Gmail client with auto-refreshed tokens
 */
export async function getGmailClientWithRefresh(
  userId: string,
  tokens: GoogleTokens
) {
  const validTokens = await getValidTokens(userId, tokens);
  return getGmailClient(validTokens);
}

export async function listMessages(tokens: GoogleTokens, maxResults: number = 10) {
  const gmail = getGmailClient(tokens);

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
  });

  return response.data.messages || [];
}

export async function getMessage(tokens: GoogleTokens, messageId: string) {
  const gmail = getGmailClient(tokens);

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  return response.data;
}

export async function sendEmail(
  tokens: GoogleTokens,
  to: string,
  subject: string,
  body: string
) {
  const gmail = getGmailClient(tokens);

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data;
}

export async function draftEmail(
  tokens: GoogleTokens,
  to: string,
  subject: string,
  body: string
) {
  const gmail = getGmailClient(tokens);

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        raw: encodedMessage,
      },
    },
  });

  return response.data;
}

/**
 * Extracts the plain text body from a Gmail message
 */
export function extractEmailBody(message: any): string {
  if (!message.payload) return '';

  // Helper function to extract text from a part
  const extractPartText = (part: any): string => {
    if (part.body?.data) {
      return Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
    return '';
  };

  // If it's a multipart message, find the text/plain part
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain') {
        return extractPartText(part);
      }
      // Check nested parts
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === 'text/plain') {
            return extractPartText(nestedPart);
          }
        }
      }
    }
  }

  // If it's a simple message, extract directly
  if (message.payload.body?.data) {
    return Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  return '';
}

/**
 * Extracts email headers (From, Subject, etc.) from a Gmail message
 */
export function extractEmailHeaders(message: any): Record<string, string> {
  const headers: Record<string, string> = {};
  if (message.payload?.headers) {
    for (const header of message.payload.headers) {
      headers[header.name.toLowerCase()] = header.value;
    }
  }
  return headers;
}

/**
 * Gets recent emails with their metadata for selection
 */
export async function getRecentEmailsForSelection(
  tokens: GoogleTokens,
  maxResults: number = 10
): Promise<Array<{
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
}>> {
  const messages = await listMessages(tokens, maxResults);
  const emailList = [];
  
  for (const msg of messages) {
    if (!msg.id) continue;
    
    try {
      const fullMessage = await getMessage(tokens, msg.id);
      const headers = extractEmailHeaders(fullMessage);
      const from = headers.from || 'Unknown';
      const subject = headers.subject || 'No Subject';
      const date = headers.date || '';
      
      // Extract email address from "Name <email@example.com>" format
      const extractEmail = (emailString: string): string => {
        const match = emailString.match(/<(.+)>/);
        return match ? match[1] : emailString.trim();
      };
      
      emailList.push({
        id: msg.id,
        from: from.replace(/<[^>]+>/g, '').trim() || extractEmail(from),
        fromEmail: extractEmail(from),
        subject,
        snippet: msg.snippet || '',
        date,
      });
    } catch (error) {
      console.warn(`Failed to get email ${msg.id}:`, error);
    }
  }
  
  return emailList;
}

/**
 * Matches an email from a list based on sender name/email or subject from command
 */
export function matchEmailFromCommand(
  emails: Array<{ id: string; from: string; fromEmail: string; subject: string }>,
  command: string
): { matchedEmail: { id: string; from: string; fromEmail: string; subject: string } | null; confidence: number } {
  const lowerCommand = command.toLowerCase();
  
  // Try to extract sender name or email from command
  // Patterns: "from Alex", "to John", "email from alex@example.com", "reply to Sarah"
  const senderPatterns = [
    /(?:from|to|reply to|email from)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /(?:from|to|reply to|email from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ];
  
  let matchedSender: string | null = null;
  for (const pattern of senderPatterns) {
    const match = command.match(pattern);
    if (match) {
      matchedSender = match[1].toLowerCase();
      break;
    }
  }
  
  // Try to extract subject keywords
  const subjectKeywords: string[] = [];
  // Look for quoted text (likely subject)
  const quotedMatch = command.match(/"([^"]+)"/);
  if (quotedMatch) {
    subjectKeywords.push(quotedMatch[1].toLowerCase());
  }
  
  // Look for "about X" or "regarding X"
  const aboutMatch = command.match(/(?:about|regarding)\s+(.+?)(?:\s+and|$)/i);
  if (aboutMatch) {
    subjectKeywords.push(aboutMatch[1].toLowerCase());
  }
  
  let bestMatch: { id: string; from: string; fromEmail: string; subject: string } | null = null;
  let bestScore = 0;
  
  for (const email of emails) {
    let score = 0;
    
    // Match by sender
    if (matchedSender) {
      const fromLower = email.from.toLowerCase();
      const emailLower = email.fromEmail.toLowerCase();
      
      if (emailLower.includes(matchedSender) || fromLower.includes(matchedSender)) {
        score += 50; // Strong match
      } else if (fromLower.split(' ').some(name => name.toLowerCase().startsWith(matchedSender))) {
        score += 30; // Partial name match
      }
    }
    
    // Match by subject
    if (subjectKeywords.length > 0) {
      const subjectLower = email.subject.toLowerCase();
      for (const keyword of subjectKeywords) {
        if (subjectLower.includes(keyword)) {
          score += 30;
        }
      }
    }
    
    // Boost score for more recent emails (earlier in list)
    const index = emails.indexOf(email);
    score += (emails.length - index) * 2; // Small boost for recency
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = email;
    }
  }
  
  // Only return match if confidence is high enough
  if (bestScore >= 30 && bestMatch) {
    return { matchedEmail: bestMatch, confidence: Math.min(bestScore / 100, 1) };
  }
  
  return { matchedEmail: null, confidence: 0 };
}

/**
 * Drafts a professional email reply using AI based on original email context and user instruction
 */
export async function draftEmailReply(
  tokens: GoogleTokens,
  originalEmailId: string,
  userInstruction: string
): Promise<{ to: string; subject: string; body: string }> {
  // Get the original email
  const originalEmail = await getMessage(tokens, originalEmailId);
  const headers = extractEmailHeaders(originalEmail);
  const originalBody = extractEmailBody(originalEmail);
  
  const originalSubject = headers.subject || 'No Subject';
  const originalFrom = headers.from || '';
  const originalTo = headers.to || '';
  
  // Extract email address from "Name <email@example.com>" format
  const extractEmail = (emailString: string): string => {
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString.trim();
  };
  
  const replyTo = extractEmail(originalFrom);
  const replySubject = originalSubject.startsWith('Re:') 
    ? originalSubject 
    : `Re: ${originalSubject}`;

  // Use AI to draft the reply
  const draftedBody = await draftEmailWithAI({
    originalSubject,
    originalSender: originalFrom,
    originalBody,
    userInstruction,
  });

  return {
    to: replyTo,
    subject: replySubject,
    body: draftedBody,
  };
}

/**
 * Uses OpenAI to draft a professional email based on context and user instruction
 */
async function draftEmailWithAI(context: {
  originalSubject: string;
  originalSender: string;
  originalBody: string;
  userInstruction: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const openai = new OpenAI({ apiKey });

  const prompt = `You are a professional email assistant. Draft a concise, professional email reply based on the following context.

ORIGINAL EMAIL:
From: ${context.originalSender}
Subject: ${context.originalSubject}

${context.originalBody.substring(0, 1000)}${context.originalBody.length > 1000 ? '...' : ''}

USER INSTRUCTION:
"${context.userInstruction}"

Draft a professional email reply that:
1. Acknowledges the original email appropriately
2. Addresses the user's instruction naturally
3. Is concise and professional
4. Uses appropriate tone (match the original email's formality)
5. Includes a professional closing

Return ONLY the email body text, no subject line, no "To:" field, just the message content.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional email assistant. Draft concise, professional email replies. Return only the email body text, no headers or metadata.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const draftedBody = response.choices[0].message.content?.trim() || '';
    
    // Add a professional closing if not present
    if (!draftedBody.match(/(best|regards|sincerely|thanks|thank you)/i)) {
      return `${draftedBody}\n\nBest regards`;
    }
    
    return draftedBody;
  } catch (error) {
    console.error('AI email drafting error:', error);
    // Fallback to simple reply
    return `Thank you for your email.\n\n${context.userInstruction}\n\nBest regards`;
  }
}


