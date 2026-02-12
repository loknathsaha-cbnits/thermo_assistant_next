"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChatInput } from "@/components/chat/chat-input";
import { toast } from "sonner";
import { mutate } from "swr";
import { Message } from "@/types/llm-response";
import { ChatMessage } from "./chat-message";
import { v4 as uuidv4 } from "uuid";
import { SuggestionList } from "./suggestion-list";
import { useSuggestions } from "@/hooks/use-suggestions";

const examplePrompts = [
  {
    title: "Advanced Genetic Testing & Sequencing Systems",
    prompt:
      "What genetic sequencing machines does Thermo Fisher Scientific use in medical research and diagnostics?",
  },
  {
    title: "Clinical Laboratory Automation & Diagnostic Instruments",
    prompt:
      "List of automated lab instruments by Thermo Fisher Scientific for hospitals and clinical labs",
  },
  {
    title: "Mass Spectrometry & Analytical Medical Devices",
    prompt:
      "How Thermo Fisher Scientific mass spectrometers are used in medical testing and disease detection",
  },
  {
    title: "Biopharma Manufacturing & Cell Therapy Technologies",
    prompt:
      "Thermo Fisher Scientific equipment for vaccine production and cell therapy manufacturing",
  },
];

export function NewChatWelcome() {
  const router = useRouter();
  const { data: session } = useSession();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { suggestions, isLoading: isSuggestionsLoading } = useSuggestions(searchQuery);

  const handleSubmit = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || !session?.user || isLoading) return;

      setSearchQuery("");
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: prompt,
        timestamp: new Date(),
      };

      setMessages([userMessage]);
      setShowWelcome(false);
      setInputValue("");
      setIsLoading(true);

      // Create placeholder assistant message for streaming
      const assistantMessageId = uuidv4();
      const streamingMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, streamingMessage]);

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userPrompt: prompt,
          }),
        });

        if (!response.ok) {
          toast.error("Daily quota limit exceeded. Please try again tomorrow.");
          router.push('/chat');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        let conversationId = "";
        let newTitleGenerated = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "metadata") {
                  conversationId = data.conversationId;
                } else if (data.type === "content") {
                  // Update streaming message content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + data.content }
                        : msg,
                    ),
                  );
                } else if (data.type === "complete") {
                  // Finalize the message and navigate
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                          ...msg,
                          id: data.messageId,
                          timestamp: new Date(data.timestamp),
                          isStreaming: false,
                        }
                        : msg,
                    ),
                  );
                  newTitleGenerated = data.newTitleGenerated;
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error("Error parsing stream data:", parseError);
              }
            }
          }
        }

        // Invalidate the conversations cache to update the sidebar
        if (newTitleGenerated) {
          mutate("/api/conversations");
        }

        // Navigate to the conversation
        if (conversationId) {
          router.push(`/chat/${conversationId}`);
        }
      } catch (error: unknown) {
        console.error("Error creating conversation:", error);

        toast.error("Daily quota limit exceeded. Please try again tomorrow.");

        setMessages([]);
        setShowWelcome(true);
        setInputValue(prompt);
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user, router, isLoading],
  );

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!session?.user) return null;

  if (!showWelcome && messages.length > 0) {
    return (
      <div className="container mx-auto h-[calc(100vh-3.5rem)] w-full flex flex-col justify-between gap-1 pb-1">
        <div className="flex flex-1 flex-col rounded-md">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="sticky bottom-0 flex flex-col gap-2 p-2 bg-background">
            <div className="p-2 bg-accent rounded-[25px]">
              <ChatInput
                ref={inputRef}
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                setSearchQuery={setSearchQuery}
                suggestions={suggestions}
                selectedIndex={selectedIndex}
                onSelectedIndexChange={setSelectedIndex}
                isLoading={isLoading}
                placeholder="Ask questions on thermofisher scientific..."
              />
            </div>
            <p className="mx-auto text-center text-xs font-normal tracking-tight leading-3 text-primary/75 whitespace-nowrap">
              Thermo Assistant can make mistakes. Check before use.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-3 h-[calc(100vh-3.5rem)] w-full flex flex-col lg:justify-center justify-between items-center gap-8">
      <div className="h-0 w-full lg:hidden" />

      <main className="flex flex-col justify-center items-center gap-8 w-full">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Ask anything about ThermoFisher Scientific
          </h1>
        </div>

        <div className="w-full max-w-4xl p-2 bg-accent rounded-[25px]">
          <ChatInput
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            setSearchQuery={setSearchQuery}
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            onSelectedIndexChange={setSelectedIndex}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            placeholder="Describe the scientific concept you want to visualize..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full h-40">
          {suggestions.length > 0 || inputValue ? (
            <SuggestionList
              suggestions={suggestions}
              onSelect={(suggestion) => {
                setInputValue(suggestion);
              }}
              isLoading={isLoading}
              selectedIndex={selectedIndex}
              className="md:col-span-2"
            />
          ) : (
            examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputValue(example.prompt);
                  inputRef.current?.focus();
                }}
                className="p-4 text-left border rounded-lg hover:bg-accent transition-colors"
                disabled={isLoading}
              >
                <h3 className="font-semibold text-sm mb-2">{example.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 overflow-hidden">
                  {example.prompt}
                </p>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
