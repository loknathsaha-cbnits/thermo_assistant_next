import { GoogleGenerativeAI } from "@google/generative-ai";

interface Gemini {
  apiKey: string;
  model: string;
}

export const gemini = ({apiKey, model}: Gemini) => {
  if (!model) {
    throw new Error("Missing gemini model");
  }
  
  if (!apiKey) {
    throw new Error("Missing gemini api key");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });

  return geminiModel;
}
