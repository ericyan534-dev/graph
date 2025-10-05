import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search } from "lucide-react";
import { sendChat } from "@/lib/api";
import type { OrchestratorResponse, PolicySearchHit } from "@/types/orchestrator";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  citations?: OrchestratorResponse["answer"]["citations"];
  guardrailWarnings?: string[];
};

type Policy = PolicySearchHit & { messageId: string };

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [mode, setMode] = useState<"describe" | "troubleshoot">("describe");
  const [logs, setLogs] = useState<string[]>([]);

  const chatMutation = useMutation({
    mutationFn: async (input: { content: string; assistantId: string }) => {
      const response = await sendChat(input.content);
      return { response, assistantId: input.assistantId, content: input.content };
    },
    onSuccess: ({ response, assistantId }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: response.answer.answer,
                isStreaming: false,
                citations: response.answer.citations,
                guardrailWarnings: response.guardrail.warnings,
              }
            : message
        )
      );

      setPolicies((prev) => [
        ...prev.filter((p) => p.messageId !== assistantId),
        ...response.policies.map((policy) => ({
          ...policy,
          messageId: assistantId,
        })),
      ]);

      setLogs(response.logs ?? []);
    },
    onError: (error, variables) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === variables.assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? `Sorry, something went wrong: ${error.message}`
                    : "Sorry, something went wrong while contacting the orchestrator.",
                isStreaming: false,
              }
            : message
        )
      );
    },
  });

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    chatMutation.mutate({ content, assistantId: assistantMessageId });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6 text-foreground" />
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Legislative Transparency
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ModeSelector mode={mode} onModeChange={setMode} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="bg-primary rounded-sm p-6 mb-6">
                <Search className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-3 tracking-tight">
                Ask about legislation
              </h2>
              <p className="text-muted-foreground text-base max-w-md leading-relaxed">
                Search policies, track changes, and understand who influences
                the laws that affect you
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  <ChatMessage message={message} />
                  {message.role === "assistant" && !message.isStreaming && (
                    <div className="mt-4 space-y-3">
                      {policies
                        .filter((policy) => policy.messageId === message.id)
                        .map((policy) => (
                          <PolicyCard key={policy.billId} policy={policy} />
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {logs.length > 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Orchestrator log</p>
                  {logs.map((entry, idx) => (
                    <p key={idx}>{entry}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <div className="border-t border-border bg-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <ChatInput
            onSend={handleSendMessage}
            disabled={messages.some((m) => m.isStreaming) || chatMutation.isPending}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
