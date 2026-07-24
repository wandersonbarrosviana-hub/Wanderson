import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "Hello"
    });
    console.log(response.text);
  } catch(e) {
    console.error("1.5-pro failed:", e.message);
  }
}
run();
