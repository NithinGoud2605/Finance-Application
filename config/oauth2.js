const { google } = require('googleapis');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN
} = process.env;

if (
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  !GOOGLE_REDIRECT_URI ||
  !GOOGLE_REFRESH_TOKEN
) {
  throw new Error('Missing Google OAuth2 environment variables');
}

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// Verify token fetch works
oAuth2Client.getAccessToken()
  .then(token => console.log('Fetched access token:', token))
  .catch(err => console.error('Failed to fetch access token:', err));

async function getAccessToken() {
  const res = await oAuth2Client.getAccessToken();
  if (!res.token) throw new Error('Failed to retrieve access token');
  return res.token;
}

module.exports = { getAccessToken };