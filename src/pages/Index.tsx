import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bot, FileText, Send } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

type MutationInput = { content: string; assistantId: string };

type MutationResponse = {
  response: OrchestratorResponse;
  assistantId: string;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to PolyScope. Please search for a policy or ask me about legislation, stakeholder influence, or policy analysis.",
      timestamp: new Date(),
    },
  ]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const chatMutation = useMutation<MutationResponse, Error, MutationInput>({
    mutationFn: async ({ content, assistantId }) => {
      const response = await sendChat(content);
      return { response, assistantId };
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
        ...prev.filter((policy) => policy.messageId !== assistantId),
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

  const isStreaming = useMemo(() => messages.some((message) => message.isStreaming), [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) {
      return;
    }

    const content = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const placeholder = "Search for a policy or ask about legislation, stakeholders, or analysis...";

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">PolyScope</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Policy Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/about">
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </Button>
            </Link>
            <Badge className="border-success/20 bg-success/10 text-success">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-success" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="space-y-6">
            {messages.map((message) => {
              const relatedPolicies = policies.filter((policy) => policy.messageId === message.id);
              const showPolicies = message.role === "assistant" && !message.isStreaming && relatedPolicies.length > 0;

              return (
                <div key={message.id} className="space-y-4">
                  <ChatMessage message={message}>
                  </ChatMessage>

                  {showPolicies && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {relatedPolicies.map((policy) => (
                        <PolicyCard key={policy.billId} policy={policy} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {logs.length > 0 && (
              <Card className="border-dashed border-border/70 bg-card p-4 text-xs text-muted-foreground">
                <p className="mb-2 text-sm font-semibold text-foreground">Orchestrator log</p>
                <div className="space-y-1">
                  {logs.map((entry, index) => (
                    <p key={`${entry}-${index}`}>{entry}</p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[60px] max-h-[200px] flex-1 resize-none"
                rows={2}
                disabled={chatMutation.isPending || isStreaming}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending || isStreaming}
                className="px-6 gradient-primary hover:shadow-glow transition-all"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
              <p>Press Enter to send, Shift+Enter for new line</p>
              <p className="flex items-center gap-2">
                Powered by orchestrator intelligence
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
