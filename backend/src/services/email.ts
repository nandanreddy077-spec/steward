import { google } from 'googleapis';
import { GoogleTokens } from '../types';

export function getGmailClient(tokens: GoogleTokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oauth2Client });
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

