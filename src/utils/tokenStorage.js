import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

async function saveTokensToDatabase(tokens) {
  if (!tokens || !tokens.access_token) {
    throw new Error("Invalid tokens received");
  }

  const filePath = path.join(rootDir, "tokens.json");

  try {
    await writeFileAsync(filePath, JSON.stringify(tokens, null, 2));
    console.log("Tokens saved successfully.");
  } catch (error) {
    console.error("Error saving tokens to database:", error);
    throw error;
  }
}

async function getStoredTokens() {
  const filePath = path.join(rootDir, "tokens.json");

  try {
    if (fs.existsSync(filePath)) {
      const tokensData = await readFileAsync(filePath, "utf8");

      try {
        return JSON.parse(tokensData);
      } catch (parseError) {
        console.warn("Error parsing tokens from database: Invalid JSON format");
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error reading tokens from database:", error);
    return null;
  }
}

export { saveTokensToDatabase, getStoredTokens };
