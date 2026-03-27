import { google } from 'googleapis';
import { GoogleTokens } from '../types';
import { supabase } from './db';

/**
 * Checks if a token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(tokens: GoogleTokens): boolean {
  if (!tokens.expiry_date) {
    return false; // No expiry date, assume valid
  }

  const expiryTime = tokens.expiry_date;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Token is expired or will expire within 5 minutes
  return expiryTime <= (now + fiveMinutes);
}

/**
 * Refreshes Google OAuth tokens
 */
export async function refreshGoogleTokens(
  userId: string,
  tokens: GoogleTokens
): Promise<GoogleTokens> {
  if (!tokens.refresh_token) {
    throw new Error('No refresh token available. User needs to reconnect their Google account.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    const newTokens: GoogleTokens = {
      access_token: credentials.access_token!,
      refresh_token: tokens.refresh_token, // Keep the same refresh token
      expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000, // Default 1 hour
      token_type: credentials.token_type || 'Bearer',
      scope: credentials.scope || tokens.scope,
    };

    // Update tokens in database
    const { error } = await supabase
      .from('users')
      .update({
        google_tokens: newTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update tokens in database:', error);
      // Still return new tokens even if DB update fails
    }

    return newTokens;
  } catch (error: any) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh access token. Please reconnect your Google account.');
  }
}

/**
 * Gets valid tokens, refreshing if necessary
 */
export async function getValidTokens(
  userId: string,
  tokens: GoogleTokens
): Promise<GoogleTokens> {
  if (isTokenExpired(tokens)) {
    console.log(`Token expired for user ${userId}, refreshing...`);
    return await refreshGoogleTokens(userId, tokens);
  }

  return tokens;
}




