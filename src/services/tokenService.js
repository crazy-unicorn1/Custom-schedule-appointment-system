import { getStoredTokens } from "../utils/tokenStorage.js";

const verifyToken = async (oauth2Client) => {
  try {
    const accessToken = oauth2Client.credentials.access_token;
    if (!accessToken) {
      console.log("Access token is missing.");
      return false;
    }

    const { data } = await oauth2Client.request({
      url: "https://www.googleapis.com/oauth2/v2/userinfo",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Token is valid:");
    return true;
  } catch (error) {
    console.error("Token is invalid:", error);
    return false;
  }
};

const refreshAccessToken = async (oauth2Client) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!oauth2Client.credentials.refresh_token) {
        const storedTokens = await getStoredTokens();
        if (storedTokens && storedTokens.refresh_token) {
          oauth2Client.setCredentials(storedTokens);
        } else {
          return reject(new Error("Refresh token is missing."));
        }
      }

      oauth2Client.refreshAccessToken((err, tokens) => {
        if (err) {
          console.error("Error refreshing access token:", err);
          return reject(err);
        } else {
          oauth2Client.setCredentials(tokens);
          console.log("Access token refreshed:", tokens.access_token);
          resolve(tokens.access_token);
        }
      });
    } catch (error) {
      console.error("Error in refreshAccessToken:", error);
      reject(error);
    }
  });
};

export { verifyToken, refreshAccessToken };
