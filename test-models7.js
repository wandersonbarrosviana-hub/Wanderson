import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: "Hello"
    });
    console.log("2.0-flash-lite:", response.text);
  } catch(e) {
    console.error("2.0-flash-lite failed:", e.message);
  }
}
run();
