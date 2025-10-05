import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  mode: "describe" | "troubleshoot";
};

export const ChatInput = ({ onSend, disabled, isLoading, mode }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const placeholder =
    mode === "describe"
      ? "Ask about a bill, policy, or legislative change..."
      : "Need help finding something? Ask for search tips...";

  const submitDisabled = disabled || !input.trim();

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="max-h-[200px] min-h-[60px] resize-none"
        rows={2}
      />
      <Button
        type="submit"
        disabled={submitDisabled}
        className="h-[60px] px-6 transition-opacity bg-gradient-primary hover:opacity-90"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  );
};
