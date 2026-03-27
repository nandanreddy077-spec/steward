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
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
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

    if (!tokens.access_token) {
      console.error('No access token received from Google');
      return res.status(400).json({ error: 'Failed to get access token from Google' });
    }

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    
    let userInfo;
    try {
      userInfo = await oauth2.userinfo.get();
    } catch (userInfoError: any) {
      console.error('Error fetching user info from Google:', userInfoError);
      // If we can't get user info, we can still proceed with tokens
      // We'll use a placeholder email from the token if available
      // For now, return an error but log the actual issue
      return res.status(500).json({ 
        error: 'Failed to authenticate',
        details: userInfoError.message || 'Could not fetch user information from Google'
      });
    }

    if (!userInfo.data || !userInfo.data.email) {
      console.error('Invalid user info from Google:', userInfo.data);
      return res.status(500).json({ error: 'Invalid user information from Google' });
    }

    // Store or update user in database
    // First check if user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userInfo.data.email)
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for new users
      console.error('Error checking for existing user:', userCheckError);
      return res.status(500).json({ error: 'Database error while checking user' });
    }

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

    // Build redirect URL - use the same format that Linking.createURL generates
    const queryParams = `success=true&userId=${user.id}&email=${encodeURIComponent(user.email || '')}&name=${encodeURIComponent(user.name || '')}`;
    
    // The app uses Linking.createURL('/auth/callback') which generates:
    // exp://[expo-dev-server-url]/--/auth/callback
    // From the logs, we can see the Expo URL is: exp://gzkhens-nandan_07-8081.exp.direct
    // So the full redirect URL should be: exp://gzkhens-nandan_07-8081.exp.direct/--/auth/callback
    
    // Use the Expo URL format that matches what Linking.createURL generates
    const expoRedirectUrl = `exp://gzkhens-nandan_07-8081.exp.direct/--/auth/callback?${queryParams}`;
    const appRedirectUrl = `rork-app://auth/callback?${queryParams}`;
    
    // Try direct redirect - WebBrowser.openAuthSessionAsync should catch it
    // The redirectUrl passed to openAuthSessionAsync is what it listens for
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    // For mobile, redirect to the Expo URL format that matches Linking.createURL
    // This is what WebBrowser.openAuthSessionAsync is listening for
    if (isMobile) {
      res.redirect(expoRedirectUrl);
      return;
    }
    
    // Fallback: Send HTML page with redirect attempts
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
            <a href="${expoRedirectUrl}" class="button" id="redirectButton" onclick="window.location.href='${expoRedirectUrl}'; return false;">
              Return to App
            </a>
          </div>
          <script>
            // Try multiple redirect methods
            function tryRedirect() {
              // Method 1: Try Expo scheme (what WebBrowser.openAuthSessionAsync expects)
              try {
                window.location = '${expoRedirectUrl}';
              } catch (e) {
                console.log('Expo redirect failed:', e);
              }
              
              // Method 2: Try custom scheme as fallback
              setTimeout(function() {
                try {
                  window.location = '${appRedirectUrl}';
                } catch (e) {
                  console.log('Custom scheme redirect failed:', e);
                }
              }, 500);
              
              // Method 3: Show button as fallback
              setTimeout(function() {
                var button = document.getElementById('redirectButton');
                if (button) {
                  button.style.display = 'inline-block';
                }
              }, 1500);
            }
            
            // Try redirect immediately
            tryRedirect();
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

