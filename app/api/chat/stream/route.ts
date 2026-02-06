import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { gemini } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { systemInstructions } from "@/lib/instruction-prompt";
import { generateTitle, MessageType } from "@/actions/generateTitle";
import { v4 as uuidv4 } from "uuid";
import { fetchPdfAsBase64 } from "@/lib/pdfToBase64";

const chatSchema = z.object({
    userPrompt: z.string().min(1).max(10000),
    conversationId: z.string().optional()
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const parsed = chatSchema.safeParse(body);

        if (!parsed.success) {
            return new Response(JSON.stringify({ error: parsed.error.issues }), {
                status: 400,
            });
        }

        const { userPrompt, conversationId: providedConversationId } = parsed.data;
        const userId = session.user.id;

        /* ------------------ Conversation ------------------ */

        let conversationId = providedConversationId;
        let convo;

        if (!conversationId) {
            convo = await prisma.conversation.create({
                data: { userId },
                select: { id: true, title: true },
            });
            conversationId = convo.id;
        } else {
            convo = await prisma.conversation.findUnique({
                where: { id: conversationId },
                select: { id: true, title: true },
            });
        }

        if (!convo) {
            return new Response("Conversation not found", { status: 404 });
        }

        /* ------------------ History ------------------ */

        const history = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" },
            take: 20,
        });

        await prisma.message.create({
            data: {
                conversationId,
                author: "USER",
                content: userPrompt,
            },
        });

        /* ------------------ Gemini Chat ------------------ */

        if (!process.env.GEMINI_API_KEY || !process.env.GENERATIVE_LLM_MODEL) {
            throw new Error("Missing gemini model or api key");
        }

        const geminiModel = gemini({
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GENERATIVE_LLM_MODEL,
        });

        const pdfBase64 = await fetchPdfAsBase64(
            "https://cbnits-dataset.s3.dualstack.us-east-1.amazonaws.com/dataset.pdf"
        );

        const stream = await geminiModel.generateContentStream([
            {
                inlineData: {
                    data: pdfBase64,
                    mimeType: "application/pdf",
                },
            },
            {
                text: `${systemInstructions}\n\n${userPrompt}`,
            },
        ]);

        /* ------------------ Streaming Response ------------------ */

        const encoder = new TextEncoder();
        let fullResponse = "";

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "metadata",
                                conversationId,
                                messageId: uuidv4(),
                            })}\n\n`,
                        ),
                    );

                    for await (const chunk of stream.stream) {
                        const text = chunk.text();
                        if (!text) continue;

                        fullResponse += text;
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    type: "content",
                                    content: text,
                                })}\n\n`,
                            ),
                        );
                    }

                    const savedAssistantMessage = await prisma.message.create({
                        data: {
                            conversationId,
                            author: "ASSISTANT",
                            content: fullResponse,
                        },
                    });

                    /* ------------------ Title generation ------------------ */

                    let newTitleGenerated = false;

                    if (convo.title === "New chat") {
                        const messagesForTitle: MessageType[] = [
                            ...history.map((m) => ({
                                role: m.author.toLowerCase() as "user" | "assistant",
                                content: m.content,
                            })),
                            { role: "user", content: userPrompt },
                            { role: "assistant", content: fullResponse },
                        ];

                        const titleContext =
                            messagesForTitle.length > 6
                                ? [
                                    ...messagesForTitle.slice(0, 2),
                                    ...messagesForTitle.slice(-4),
                                ]
                                : messagesForTitle;

                        const titleRes = await generateTitle(conversationId, titleContext);
                        newTitleGenerated = !!titleRes?.success;
                    }

                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "complete",
                                messageId: savedAssistantMessage.id,
                                timestamp: savedAssistantMessage.createdAt,
                                newTitleGenerated,
                            })}\n\n`,
                        ),
                    );

                    controller.close();
                } catch (err) {
                    console.error("Streaming error:", err);
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "error",
                                error: err instanceof Error ? err.message : "Unknown error",
                            })}\n\n`,
                        ),
                    );
                    controller.close();
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (err) {
        console.error("Chat route error:", err);
        return new Response("Internal server error", { status: 500 });
    }
}
