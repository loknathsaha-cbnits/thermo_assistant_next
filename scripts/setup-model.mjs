import { pipeline } from '@huggingface/transformers';
import path from 'path';

async function downloadModel() {
  const modelId = 'Xenova/all-MiniLM-L6-v2';
  const outputDir = path.join(process.cwd(), 'models');

  console.log(`Downloading the production-ready (Q8) model...`);
  
  await pipeline('feature-extraction', modelId, {
    cache_dir: outputDir,
    // dtype: 'q8' is the v3 way to get the quantized version
    dtype: 'q8', 
    device: 'cpu',
    progress_callback: (info) => {
      if (info.status === 'progress') {
        console.log(`Downloading ${info.file}: ${info.progress.toFixed(2)}%`);
      }
    }
  });

  console.log("SUCCESS: Model cached and verified for production!");
}

downloadModel();