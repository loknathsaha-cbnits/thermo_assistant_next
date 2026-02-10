import { embedText } from "@/lib/embeddings/embedding";
import { pineconeIndex } from "@/lib/vector/pinecone";
import { QuestionMetadata } from "@/types/pinecone";
// import { boolean } from "zod";

export async function suggestQuestions(
  userQuery: string,
  topK: number = 3
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
  console.log(result)

  const MIN_SIMILARITY_SCORE = 0.7;

  return (
    result.matches
      ?.filter(match => match.score !== undefined && match.score >= MIN_SIMILARITY_SCORE)
      .map(match => (match.metadata as QuestionMetadata).question) ?? []
  );
}
