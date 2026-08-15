import { AuthorizationCode } from 'simple-oauth2';
import { getDb } from './db.js';

export async function getClient(platform: string) {
  const db = await getDb();
  const config = await db.get("SELECT * FROM app_configs WHERE platform = ?", [platform.toLowerCase()]);
  
  if (!config || !config.client_id || !config.client_secret) {
    throw new Error(`Missing App Configuration for ${platform}. Please set it up in the Backoffice.`);
  }

  const clientConfig = {
    client: {
      id: config.client_id,
      secret: config.client_secret,
    },
    auth: { tokenHost: '', tokenPath: '', authorizePath: '' }
  };

  switch (platform.toLowerCase()) {
    case 'instagram':
      clientConfig.auth = {
        tokenHost: 'https://api.instagram.com',
        tokenPath: '/oauth/access_token',
        authorizePath: '/oauth/authorize',
      };
      break;
    case 'pinterest':
      clientConfig.auth = {
        tokenHost: 'https://api.pinterest.com',
        tokenPath: '/v5/oauth/token',
        authorizePath: '/oauth',
      };
      break;
    case 'youtube':
      clientConfig.auth = {
        tokenHost: 'https://oauth2.googleapis.com',
        tokenPath: '/token',
        authorizePath: 'https://accounts.google.com/o/oauth2/v2/auth',
      };
      break;
    default: 
      throw new Error(`Unknown platform: ${platform}`);
  }

  return new AuthorizationCode(clientConfig);
}

export async function saveCredentials(platform: string, token: any) {
  const db = await getDb();
  // Using REPLACE or INSERT ON CONFLICT depending on sqlite version. We'll use INSERT OR REPLACE
  await db.run(
    `INSERT OR REPLACE INTO oauth_credentials (platform, access_token, refresh_token, expires_at) 
     VALUES (?, ?, ?, ?)`,
    [
      platform.toLowerCase(),
      token.access_token,
      token.refresh_token || null,
      token.expires_at ? new Date(token.expires_at).toISOString() : null
    ]
  );
}

export async function getValidToken(platform: string) {
  const db = await getDb();
  const row = await db.get("SELECT * FROM oauth_credentials WHERE platform = ?", [platform.toLowerCase()]);
  if (!row) {
    throw new Error(`No credentials found for ${platform}`);
  }

  const client = await getClient(platform);
  let accessToken = client.createToken({
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expires_at: row.expires_at
  });

  if (accessToken.expired()) {
    try {
      accessToken = await accessToken.refresh();
      await saveCredentials(platform, accessToken.token);
    } catch (error) {
      console.error(`Error refreshing token for ${platform}`, error);
      throw error;
    }
  }

  return accessToken.token.access_token;
}
