import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello"
    });
    console.log("2.0-flash:", response.text);
  } catch(e) {
    console.error("2.0-flash failed:", e.message);
  }
}
run();
