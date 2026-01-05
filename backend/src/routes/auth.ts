import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { supabase } from '../utils/db';
import { OAuth2Client } from 'google-auth-library';

const router = Router();

// Use localhost redirect URI (Google accepts this)
// The backend will then redirect to the app's custom scheme
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Token refresh helper
async function refreshAccessToken(refreshToken: string) {
  try {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh access token');
  }
}

// Step 1: Get authorization URL
router.get('/google', (req: Request, res: Response) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to get refresh token
  });

  res.json({ authUrl: url });
});

// Step 2: Handle callback
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store or update user in database
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userInfo.data.email)
      .single();

    let user;
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userInfo.data.name,
          google_tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (error) {
        console.error('Database update error:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }
      user = data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userInfo.data.email,
          name: userInfo.data.name,
          google_tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            token_type: tokens.token_type,
            scope: tokens.scope,
          },
        })
        .select()
        .single();
      
      if (error) {
        console.error('Database insert error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }
      user = data;
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to save user' });
    }

    // Return success page that redirects to app using custom URL scheme
    const appRedirectUrl = `rork-app://auth/callback?success=true&userId=${user.id}&email=${encodeURIComponent(user.email || '')}&name=${encodeURIComponent(user.name || '')}`;
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #000;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              max-width: 400px;
            }
            .success {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              color: #999;
              line-height: 1.5;
            }
            .user-info {
              background: #1a1a1a;
              border-radius: 12px;
              padding: 20px;
              margin-top: 20px;
            }
            .email {
              color: #fff;
              font-weight: 600;
            }
            .button {
              background: #007AFF;
              color: #fff;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              display: inline-block;
              margin-top: 20px;
              border: none;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
            }
            .button:hover {
              background: #0056CC;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>Authentication Successful!</h1>
            <p>Redirecting to app...</p>
            <div class="user-info">
              <p>Logged in as:</p>
              <p class="email">${user.email}</p>
            </div>
            <a href="${appRedirectUrl}" class="button" id="redirectButton" style="display: none;">
              Return to App
            </a>
          </div>
          <script>
            // Try to redirect to app immediately
            setTimeout(function() {
              window.location.href = '${appRedirectUrl}';
            }, 500);
            
            // Fallback: show button if redirect doesn't work
            setTimeout(function() {
              var button = document.getElementById('redirectButton');
              if (button) {
                button.style.display = 'inline-block';
              }
            }, 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      response: error?.response?.data,
      stack: error?.stack,
    });
    res.status(500).json({ 
      error: 'Failed to authenticate',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
});

// Get user by ID (for app to fetch user data after OAuth)
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, google_tokens, created_at, updated_at')
      .eq('id', req.params.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        hasGoogleTokens: !!data.google_tokens,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user tokens (for API calls) - with auto-refresh
router.get('/tokens/:userId', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', req.params.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    let tokens = data.google_tokens;

    // Check if token is expired and refresh if needed
    if (tokens?.expiry_date && tokens.refresh_token) {
      const now = Date.now();
      const expiryDate = tokens.expiry_date;
      
      // Refresh if token expires in less than 5 minutes
      if (expiryDate < now + 5 * 60 * 1000) {
        try {
          const newTokens = await refreshAccessToken(tokens.refresh_token);
          
          // Update tokens in database
          await supabase
            .from('users')
            .update({
              google_tokens: {
                ...tokens,
                access_token: newTokens.access_token,
                expiry_date: newTokens.expiry_date,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', req.params.userId);
          
          tokens = {
            ...tokens,
            access_token: newTokens.access_token,
            expiry_date: newTokens.expiry_date,
          };
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return res.status(401).json({ 
            error: 'Token expired and refresh failed. Please re-authenticate.',
            needsReauth: true 
          });
        }
      }
    }

    res.json({ tokens });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

// Refresh tokens endpoint
router.post('/refresh/:userId', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', req.params.userId)
      .single();

    if (error || !data || !data.google_tokens?.refresh_token) {
      return res.status(404).json({ error: 'User not found or no refresh token available' });
    }

    const newTokens = await refreshAccessToken(data.google_tokens.refresh_token);
    
    // Update tokens in database
    const updatedTokens = {
      ...data.google_tokens,
      access_token: newTokens.access_token,
      expiry_date: newTokens.expiry_date,
    };

    await supabase
      .from('users')
      .update({
        google_tokens: updatedTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.userId);

    res.json({ tokens: updatedTokens });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh tokens' });
  }
});

export default router;

