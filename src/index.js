import express from "express";
import dotenv from "dotenv";
import authRouter from "./routers/authRouter.js";
import calendarRouter from "./routers/calendarRouter.js";
import webhookRouter from "./routers/webhookRouter.js";

import oauth2Client from "./utils/googleAuth.js";
import { getStoredTokens } from "./utils/tokenStorage.js";
import { verifyToken, refreshAccessToken } from "./services/tokenService.js";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the avsecretweapon Backend API");
});

app.use("/auth", authRouter);

app.use(async (req, res, next) => {
  try {
    console.log(`Checking token for ${req.url} ...`);

    const tokens = await getStoredTokens();
    if (!tokens || !tokens.refresh_token) {
      return res.redirect("/auth");
    }

    const isValid = await verifyToken(oauth2Client);

    if (isValid) {
      return next();
    } else {
      console.log("Token expired or invalid. Refreshing...");

      await refreshAccessToken(oauth2Client);
      return next();
    }
  } catch (error) {
    console.error("Error in token middleware:", error);
    return res
      .status(401)
      .send("Authentication error. Please authenticate again.");
  }
});

app.use("/calendar", calendarRouter);
app.use("/webhook", webhookRouter);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
