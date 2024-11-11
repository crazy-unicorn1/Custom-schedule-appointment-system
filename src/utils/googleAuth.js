import { google } from 'googleapis';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const getRedirectUri = (host) => {
  if (process.env.NODE_ENV === 'production') {
    return `https://${host}/auth/callback`;
  } else {
    return process.env.GOOGLE_REDIRECT_URI;
  }
};

const redirectUri = getRedirectUri(process.env.HOST || 'localhost');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri
);

export default oauth2Client;
