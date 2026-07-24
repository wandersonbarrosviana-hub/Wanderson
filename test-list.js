import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBnL_eDWWHKMfvYWr4e5WoECG28h48LEMA" });
  try {
    const models = await ai.models.list();
    for await (const model of models) {
      console.log(model.name);
    }
  } catch(e) {
    console.error("List failed:", e.message);
  }
}
run();
