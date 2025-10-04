import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChat } from "@/lib/api";
import type {
  OrchestratorResponse,
  PolicyFilters,
  PolicyDNAResult,
} from "@/types/orchestrator";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  citations?: OrchestratorResponse["answer"]["citations"];
  guardrailWarnings?: string[];
};

type PolicyChatPanelProps = {
  billId: string;
  metadata?: PolicyDNAResult["metadata"];
};

export const PolicyChatPanel = ({ billId, metadata }: PolicyChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const contextualFilters = useMemo<PolicyFilters>(() => {
    const keywords = [
      metadata?.title,
      metadata?.summary,
      metadata?.billType && metadata?.billNumber
        ? `${metadata.billType.toUpperCase()} ${metadata.billNumber}`
        : undefined,
    ]
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .map((value) => value.trim());

    return {
      billId,
      congress: metadata?.congress,
      keywords,
    };
  }, [billId, metadata?.title, metadata?.summary, metadata?.billType, metadata?.billNumber, metadata?.congress]);

  const chatMutation = useMutation({
    mutationFn: async (input: { content: string; assistantId: string }) => {
      const response = await sendChat(input.content, contextualFilters);
      return { response, assistantId: input.assistantId };
    },
    onSuccess: ({ response, assistantId }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: response.answer.answer,
                citations: response.answer.citations,
                guardrailWarnings: response.guardrail.warnings,
                isStreaming: false,
              }
            : message
        )
      );
    },
    onError: (error, variables) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === variables.assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? `We couldn't reach the orchestrator: ${error.message}`
                    : "We couldn't reach the orchestrator.",
                isStreaming: false,
              }
            : message
        )
      );
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const trimmed = input.trim();
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const assistantId = `${Date.now()}-assistant`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    chatMutation.mutate({ content: trimmed, assistantId });
    setInput("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as unknown as React.FormEvent);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-medium space-y-4">
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask focused questions about this bill. We’ll keep the retrieval anchored to
            {" "}
            <span className="font-medium">{metadata?.title ?? billId}</span>.
          </p>
        ) : (
          messages.map((message) => <ChatMessage key={message.id} message={message} />)
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask how this policy changes over time or who funds it..."
          disabled={chatMutation.isPending}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="rounded-full"
          >
            <Send className="h-4 w-4 mr-2" /> Ask
          </Button>
        </div>
      </form>
    </div>
  );
};
