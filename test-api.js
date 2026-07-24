import { GoogleGenAI } from "@google/genai";
try {
  const ai = new GoogleGenAI({ 
    apiKey: "dummy",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("OK");
} catch (e) {
  console.error(e.message);
}
