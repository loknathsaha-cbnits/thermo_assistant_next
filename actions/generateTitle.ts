'use server';

import { prisma } from "@/lib/prisma";
import { gemini } from "@/lib/gemini";

export type MessageType = {
  role: "user" | "assistant";
  content: string;
};

export async function generateTitle(
  conversationId: string,
  messages: MessageType[]
) {
  // 1. Check if title already exists — never regenerate
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { title: true },
  });

  if (conversation?.title && conversation.title !== "New chat") {
    return { success: true, newTitle: conversation.title };
  }

  // 2. Require at least one user message
  const firstUserMessage = messages.find(m => m.role === "user");
  if (!firstUserMessage) {
    return { success: false, error: "No user message to generate title from" };
  }

  // 3. Optional: include first assistant reply if it exists
  const firstAssistantMessage = messages.find(m => m.role === "assistant");

  const conversationSnippet = [
    `User: ${firstUserMessage.content}`,
    firstAssistantMessage
      ? `Assistant: ${firstAssistantMessage.content}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const contents = [
    {
      role: "user",
      parts: [
        {
          text:
            "Create a short, concise 2-5 word noun-phrase title for this conversation. " +
            "Do not use quotation marks.\n\n" +
            conversationSnippet,
        },
      ],
    },
  ];

  try {
    if (!process.env.GEMINI_TITLE_API_KEY || !process.env.GENERATIVE_LLM_MODEL) {
      throw new Error("Missing gemini model or api key");
    }

    const geminiModel = gemini({
      apiKey: process.env.GEMINI_TITLE_API_KEY,
      model: process.env.GENERATIVE_LLM_MODEL,
    });

    const result = await geminiModel.generateContent({
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 20,
      },
    });

    const title = result.response.text()?.trim().slice(0, 100) || "New chat";

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });

    return { success: true, newTitle: title };
  } catch (error) {
    console.error("Error generating title:", error);
    return { success: false, error: "Failed to generate title" };
  }
}
