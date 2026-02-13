import { embedText } from "@/lib/embeddings/embedding";
import { pineconeIndex } from "@/lib/vector/pinecone";
import { QuestionMetadata } from "@/types/pinecone";

export async function suggestQuestions(
  userQuery: string,
  topK: number = 3,
): Promise<string[]> {
  if (!userQuery || !userQuery.trim()) {
    return [];
  }

  const queryEmbedding = await embedText(userQuery);
  console.log("Vector Dimension:", queryEmbedding.length);

  const result = await pineconeIndex.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  console.log("Parsed result is: ", result);
  const MIN_SIMILARITY_SCORE = 0.199950779;

  return (
    result.matches
      ?.filter(
        (match) =>
          typeof match.score === "number" &&
          match.score >= MIN_SIMILARITY_SCORE,
      )
      .map((match) => (match.metadata as QuestionMetadata)?.text) // 1. Optional chaining
      .filter((text): text is string => !!text) ?? []
  ); // 2. Truthy filter
}
