"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "./chat-message";
import { SuggestionList } from "./suggestion-list";
import { useSuggestions } from "@/hooks/use-suggestions";
import { useConversation } from "@/hooks/use-conversation";
import { examplePrompts } from "@/lib/constants/examplePrompts";
import { dialogues } from "@/lib/constants/new-chat-dialogue";

export function NewChatWelcome() {
  const { data: session } = useSession();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { suggestions, isLoading: isSuggestionsLoading } = useSuggestions(searchQuery);

  const setSuggestionsEmpty = useCallback(() => setSearchQuery(""), []);
  const { messages, isSendingMessage, handleSendMessage } = useConversation(null, setSuggestionsEmpty);

  const [dialogue] = useState(() => dialogues[Math.floor(Math.random() * dialogues.length)]);

  const [randomExamples] = useState(() =>
    [...examplePrompts]
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
  );
  const handleSubmit = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
      setInputValue("");
      setSearchQuery("");
    },
    [handleSendMessage],
  );

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!session?.user) return null;

  if (messages.length > 0) {
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
                isLoading={isSendingMessage}
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

      <main className="flex flex-col justify-center items-center gap-8 w-full h-full">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            {dialogue}
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
            isLoading={isSendingMessage}
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
              isLoading={isSendingMessage}
              selectedIndex={selectedIndex}
              className="md:col-span-2"
            />
          ) : (
            randomExamples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(example.prompt);
                    inputRef.current?.focus();
                  }}
                  className="p-4 text-left border rounded-lg hover:bg-accent transition-colors md:h-24 h-20"
                  disabled={isSendingMessage}
                >
                  <h3 className="font-semibold text-sm mb-2">{example.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 overflow-hidden truncate">
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
