import express from "express";
import oauth2Client from "../utils/googleAuth.js";
import { saveTokensToDatabase } from "../utils/tokenStorage.js";

const authRouter = express.Router();

// Route to initiate OAuth2 flow
authRouter.get("/", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
  res.redirect(url);
});

// Route to handle OAuth2 callback and save tokens
authRouter.get("/callback", (req, res) => {
  const code = req.query.code;

  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error("Error retrieving tokens:", err);
      return res.status(500).send("Authentication failed.");
    }

    oauth2Client.setCredentials(tokens);
    res.status(200).send("Authentication successful.");
  });
});

// Event listener for token changes (access token or refresh token)
oauth2Client.on("tokens", async (tokens) => {
  try {
    if (tokens.refresh_token) {
      await saveTokensToDatabase(tokens);
    }
  } catch (error) {
    console.error("Error handling new tokens:", error);
  }
});

export default authRouter;
