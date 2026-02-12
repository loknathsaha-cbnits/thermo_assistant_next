import { cn } from "@/lib/utils";

interface SuggestionListProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading?: boolean;
  className?: string;
  position?: "up" | "down";
  selectedIndex?: number;
}

export function SuggestionList({
  suggestions,
  onSelect,
  className,
  position = "down",
  selectedIndex = -1
}: SuggestionListProps) {
  if (!suggestions.length) return null;

  return (
    <div
      className={cn(
        "rounded-lg flex flex-col w-full",
        position === "up" ? "flex-col-reverse" : "flex-col",
        className
      )}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={cn(
            "justify-start h-auto py-3 px-4 text-left cursor-pointer",
            "hover:bg-accent/50 last:border-0",
            position === "up" ? "border-t" : "border-b",
            selectedIndex === index && "bg-accent"
          )}
          onClick={() => onSelect(suggestion)}
        >
          <span className="truncate w-full block">{suggestion}</span>
        </div>
      ))}

    </div>
  );
}
