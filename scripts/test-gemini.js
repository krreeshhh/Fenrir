const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  console.log("Checking API Key format:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");
  
  if (!apiKey) {
    console.log("Error: GEMINI_API_KEY is not set in environment.");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    console.log("Attempting to generate content with gemini-3.1-flash-lite-preview...");
    const result = await model.generateContent("Hello?");
    const response = await result.response;
    console.log("Success! Response text:", response.text());
  } catch (err) {
    console.error("Diagnostic Failed:");
    console.error("Type:", err.constructor.name);
    console.error("Message:", err.message);
    if (err.stack) console.error("Stack:", err.stack);
  }
}

test();
