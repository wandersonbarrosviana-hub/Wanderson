import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Hello"
    });
    console.log("gemini-flash-latest (default):", response.text);
  } catch(e) {
    console.error("gemini-flash-latest (default) failed:", e.message);
  }
}
run();
