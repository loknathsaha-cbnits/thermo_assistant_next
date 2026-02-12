import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.INDEX_NAME!;

// pinecone client/object creation
export const pineconeIndex = pinecone.index({name: INDEX_NAME});

export async function doesIndexExist(): Promise<boolean> {
  const indexes = await pinecone.listIndexes();
  return (
    indexes.indexes?.some((index) => index.name === INDEX_NAME) ?? false
  );
}

export async function ensureIndexExists() {
  const exists = await doesIndexExist();

  if (!exists) {
    console.log("Creating Pinecone index:", INDEX_NAME);

    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: 384, 
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
      // Optimization: The SDK will poll for you until the index is live
      waitUntilReady: true, 
      // Optional: Prevents errors if the index was created by another process simultaneously
      suppressConflicts: true 
    });

    console.log("Pinecone index created and ready for data.");
  }
}


export async function isIndexEmpty(): Promise<boolean> {
  const stats = await pineconeIndex.describeIndexStats();
  return (stats.totalRecordCount ?? 0) === 0;
}
