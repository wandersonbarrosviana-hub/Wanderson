import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: "Hello"
    });
    console.log("3.1-pro-preview:", response.text);
  } catch(e) {
    console.error("3.1-pro-preview failed:", e.message);
  }
}
run();
