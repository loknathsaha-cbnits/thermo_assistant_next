import { forwardRef, KeyboardEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  suggestions: string[];
  selectedIndex: number;
  isLoading?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  setSearchQuery?: (value: string) => void;
  onSelectedIndexChange: (index: number) => void;
}

export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ value, suggestions, selectedIndex, isLoading = false, placeholder, onChange, onSubmit, setSearchQuery, onSelectedIndexChange }, ref) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || localRef;

    // Reset selected index when suggestions change
    useEffect(() => {
      onSelectedIndexChange(-1);
    }, [suggestions, onSelectedIndexChange]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // If a suggestion is selected, submit it; otherwise submit current value
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSubmit(suggestions[selectedIndex]);
        } else if (value.trim()) {
          onSubmit(value.trim());
        }
        onSelectedIndexChange(-1);
        return;
      }

      if (suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (selectedIndex + 1) % suggestions.length;
        onSelectedIndexChange(nextIndex);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
        onSelectedIndexChange(prevIndex);
      }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      if (setSearchQuery) {
        setSearchQuery(e.target.value);
      }
      autoResize(e.target);
    };

    const autoResize = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`; // Max ~5 lines
    };

    useEffect(() => {
      if (combinedRef.current) autoResize(combinedRef.current);
    }, [combinedRef, value]);

    return (
      <div className="relative w-full rounded-xl px-1 bg-transparent">
        <Textarea
          id="chat-textarea"
          ref={combinedRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={isLoading}
          className={cn("pr-14 resize-none border-none text-sm leading-7 focus-visible:outline-none focus-visible:ring-0 shadow-none placeholder:text-base max-h-40 overflow-y-auto")}
        />

        <div className="flex items-center justify-end">
          <Button
            className="rounded-full px-1"
            size="icon"
            onClick={() => {
              if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                onSubmit(suggestions[selectedIndex]);
              } else if (value.trim()) {
                onSubmit(value.trim());
              }
              onSelectedIndexChange(-1);
            }}
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";