import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Hello"
    });
    console.log("gemini-flash-latest:", response.text);
  } catch(e) {
    console.error("gemini-flash-latest failed:", e.message);
  }
}
run();
