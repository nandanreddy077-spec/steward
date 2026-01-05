import { Router } from 'express';
import { google } from 'googleapis';
import { supabase } from '../utils/db';

const router = Router();

// Use localhost redirect URI (Google accepts this)
// The backend will then redirect to the app's custom scheme
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Step 1: Get authorization URL
router.get('/google', (req, res) => {
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
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;

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
router.get('/user/:userId', async (req, res) => {
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

// Get user tokens (for API calls)
router.get('/tokens/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('google_tokens')
      .eq('id', req.params.userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ tokens: data.google_tokens });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

export default router;

