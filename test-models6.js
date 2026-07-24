import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-8b",
      contents: "Hello"
    });
    console.log("1.5-flash-8b:", response.text);
  } catch(e) {
    console.error("1.5-flash-8b failed:", e.message);
  }
}
run();
