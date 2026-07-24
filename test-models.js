import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello"
    });
    console.log(response.text);
  } catch(e) {
    console.error("2.0-flash failed:", e.message);
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello"
    });
    console.log(response.text);
  } catch(e) {
    console.error("1.5-flash failed:", e.message);
  }
}
run();
