"use client";

import axios from "axios";
import { toast } from "sonner";
import useSWR, { mutate } from 'swr';
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { Message } from "@/types/llm-response";
import { v4 as uuidv4 } from "uuid";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function useConversation(conversationId: string | null) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const { data: messages = [], mutate: mutateMessages, error } = useSWR<Message[]>(
    user && conversationId ? `/api/chat/${conversationId}` : null,
    fetcher,
    {
      onError: (err) => {
        console.error(err);
        if (conversationId) {
          toast.error(`Unable to load conversation ${conversationId}`);
          router.push('/chat');
        }
      }
    }
  );

  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const handleSendMessage = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || !user || !conversationId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: userPrompt,
      timestamp: new Date(),
    };

    // Add user message immediately
    await mutateMessages(prev => [...(prev || []), userMessage], false);
    setIsSendingMessage(true);

    // Create placeholder assistant message for streaming
    const assistantMessageId = uuidv4();
    const streamingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    await mutateMessages(prev => [...(prev || []), streamingMessage], false);

    try {
      const response = await fetch('/api/chat/stream2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt,
          conversationId
        }),
      });

      if (!response.ok) {
        // throw new Error(`HTTP error! status: ${response.status}`);
        toast.error("Daily quota limit exceeded. Please try again tomorrow.");
        router.push('/chat');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let newTitleGenerated = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                // Update streaming message content
                await mutateMessages(prev =>
                  prev?.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + data.content }
                      : msg
                  ) || [], false
                );
              } else if (data.type === 'complete') {
                // Finalize the message
                await mutateMessages(prev =>
                  prev?.map(msg =>
                    msg.id === assistantMessageId
                      ? {
                        ...msg,
                        id: data.messageId,
                        timestamp: new Date(data.timestamp),
                        isStreaming: false
                      }
                      : msg
                  ) || [], false
                );
                newTitleGenerated = data.newTitleGenerated;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }

      if (newTitleGenerated) {
        mutate("/api/conversations");
      }

    } catch (error: unknown) {
      console.error("Error sending message:", error);
      toast.error("Daily quota limit exceeded. Please try again tomorrow.");

      // Remove both user and assistant messages on error
      await mutateMessages(prev => prev?.slice(0, -2) || [], false);
    } finally {
      setIsSendingMessage(false);
    }
  }, [user, conversationId, mutateMessages, router]);

  return {
    messages,
    isLoading: !messages && !error,
    isSendingMessage,
    handleSendMessage
  };
}