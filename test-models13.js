import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-pro-latest",
      contents: "Hello"
    });
    console.log("gemini-pro-latest:", response.text);
  } catch(e) {
    console.error("gemini-pro-latest failed:", e.message);
  }
}
run();
