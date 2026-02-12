"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChatInput } from "@/components/chat/chat-input";
import { useConversation } from "@/hooks/use-conversation";
import { ChatMessage } from "@/components/chat/chat-message";
import { SuggestionList } from "@/components/chat/suggestion-list";
import { cn } from "@/lib/utils";
import { useSuggestions } from "@/hooks/use-suggestions";

export function ChatInterface() {
  const params = useParams();
  const convoIdFromUrl = (params.conversationId as string) || null;
  const { data: session } = useSession();
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { suggestions } = useSuggestions(searchQuery);
  const { messages, isSendingMessage, handleSendMessage } = useConversation(convoIdFromUrl);

  useEffect(() => {
    if (messages.length || isSendingMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    inputRef.current?.focus();
  }, [messages, isSendingMessage]);

  const handleSubmit = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
      setInputValue("");
      setSearchQuery("");
    },
    [handleSendMessage],
  );

  // Early returns if no session or user
  if (!session?.user) return null;

  if (!convoIdFromUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">No conversation selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto h-[calc(100vh-3.5rem)] w-full flex flex-col justify-between gap-1 pb-1">
      <div className="flex flex-1 flex-col rounded-md">
        <div className={cn(
          "flex-1 p-4 space-y-4 overflow-y-auto",
          suggestions.length > 0 && "opacity-20 "
        )}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="sticky bottom-0 flex flex-col gap-2 p-2 bg-background">
          <SuggestionList
            suggestions={suggestions}
            onSelect={(suggestion) => {
              setInputValue(suggestion);
              setSearchQuery("");
            }}
            isLoading={isSendingMessage}
            position="up"
            selectedIndex={selectedIndex}
          />
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
            Assistant can make mistakes. Please verify the information before using it.
          </p>
        </div>
      </div>
    </div>
  );
}
