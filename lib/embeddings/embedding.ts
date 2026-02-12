import { pipeline, env, FeatureExtractionPipeline } from "@huggingface/transformers";
import path from "path";
import fs from "fs";

// 1. Force the library to be purely offline
env.allowRemoteModels = false; 
const modelsPath = path.join(process.cwd(), "models");
env.localModelPath = modelsPath;
env.cacheDir = modelsPath;

let extractorInstance: FeatureExtractionPipeline | null = null;

export async function embedText(text: string): Promise<number[]> {
  // --- Debug Step: Check if local files exist ---
  const modelFolder = path.join(modelsPath, "Xenova", "all-MiniLM-L6-v2");
  if (!fs.existsSync(modelFolder)) {
    console.error(`ERROR: Model folder not found at: ${modelFolder}`);
    console.log("Did you run 'node scripts/setup-model.mjs'?");
    throw new Error("Local model files missing.");
  }

  if (!extractorInstance) {
    try {
      const result = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        dtype: 'q8', 
        device: 'cpu',
      });

      extractorInstance = result as FeatureExtractionPipeline
    } catch (err) {
      console.error("Failed to initialize pipeline:", err);
      throw err;
    }
  }

  const output = await extractorInstance(text, { 
    pooling: 'mean', 
    normalize: true 
  });

  return Array.from(output.data as Float32Array);
}