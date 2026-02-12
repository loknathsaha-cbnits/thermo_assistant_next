import { questions } from "@/constants/questions";
import { embedText } from "@/lib/embeddings/embedding";
import {
  pineconeIndex,
  // doesIndexExist,
  ensureIndexExists,
  isIndexEmpty,
} from "@/lib/vector/pinecone"; // Import your helpers
import type {
  PineconeRecord,
  RecordMetadata,
} from "@pinecone-database/pinecone";

export async function ingestIfNeeded(): Promise<void> {
  // --- STEP 1: INFRASTRUCTURE CHECK ---
  // Ensure the index exists in Pinecone first
  await ensureIndexExists();

  // --- STEP 2: CONTENT CHECK ---
  // Check if it already has data to avoid duplicate work/costs
  const isEmpty = await isIndexEmpty();
  if (!isEmpty) {
    console.log("Index already populated. Skipping ingestion.");
    return;
  }

  console.log(`Starting ingestion of ${questions.length} questions...`);

  const BATCH_SIZE = 50;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batchQuestions = questions.slice(i, i + BATCH_SIZE);

    const embeddings = await Promise.all(
      batchQuestions.map((q) => embedText(q)),
    );

    const vectors: PineconeRecord<RecordMetadata>[] = batchQuestions.map(
      (q, index) => ({
        id: `question-${i + index}`,
        values: embeddings[index],
        metadata: {
          text: q,
          source: "general_genetic_pdf",
          type: "suggestion_question",
        },
      }),
    );

    // Use the object pattern for the upsert
    await pineconeIndex.upsert({ records: vectors });

    console.log(
      `Progress: ${Math.min(i + BATCH_SIZE, questions.length)}/${questions.length}`,
    );
  }

  console.log("Pinecone index successfully populated.");
}
