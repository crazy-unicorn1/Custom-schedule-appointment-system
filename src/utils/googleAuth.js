import { google } from "googleapis";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// Set up OAuth2 client using credentials from environment variables
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://custom-schedule-appointment-system-crazyunicorns-projects.vercel.app/auth/callback"
);

export default oauth2Client;
