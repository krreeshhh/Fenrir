
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function list() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There isn't a direct listModels in the client, but we can try a fetch
    console.log("Fetching models list from API...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    const fs = require('fs');
    fs.writeFileSync('scripts/all_models.json', JSON.stringify(data, null, 2));
    console.log("All models logged to scripts/all_models.json. Count:", data.models ? data.models.length : 0);
  } catch (err) {
    console.error("List failed:", err.message);
  }
}

list();
