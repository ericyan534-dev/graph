import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Dna, FileText, Loader2, Network, Send, Shield } from "lucide-react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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

const quickActions = [
  {
    label: "Policy DNA",
    icon: Dna,
    to: (billId?: string) => (billId ? `/transparency/${billId}` : "/dna"),
  },
  {
    label: "Influence Tracker",
    icon: Network,
    to: (billId?: string) => (billId ? `/transparency/${billId}#influence` : "/influence"),
  },
  {
    label: "About",
    icon: FileText,
    to: () => "/about",
  },
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [mode, setMode] = useState<"describe" | "troubleshoot">("describe");
  const [logs, setLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const navigate = useNavigate();

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

  const placeholder =
    mode === "describe"
      ? "Ask about a bill, policy, or legislative change..."
      : "Need help finding something? Ask for search tips...";

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">PolyScope</p>
              <h1 className="text-lg font-bold tracking-tight">Policy Intelligence Hub</h1>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <ModeSelector mode={mode} onModeChange={setMode} />
            <ThemeToggle />
            <Link to="/about">
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </Button>
            </Link>
            <Badge className="flex items-center gap-2 border-success/20 bg-success/10 text-success">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6">
          {messages.length === 0 ? (
            <div className="space-y-8">
              <div className="gradient-hero rounded-3xl p-10 text-white shadow-glow">
                <div className="flex flex-col gap-4 text-balance md:flex-row md:items-end md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/80">Welcome</p>
                    <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                      Unlock deeper understanding of legislation and policy influence
                    </h2>
                    <p className="text-white/80 md:text-lg">
                      Ask questions about bills, track policy DNA, and explore the networks shaping public policy in real time.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
                    <p className="font-medium">Getting started</p>
                    <p className="text-white/80">Try asking about recent legislation or upload a bill number to analyse.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {["Search bills and statutes", "Investigate stakeholder influence", "Compare amendments over time"].map(
                  (item) => (
                    <Card key={item} className="glass border-card-border p-6 shadow-md">
                      <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                        <Shield className="h-4 w-4 text-primary" />
                        {item}
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        We surface trusted sources, highlight potential conflicts, and connect the dots for you.
                      </p>
                    </Card>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((message) => {
                const relatedPolicies = policies.filter((policy) => policy.messageId === message.id);
                const firstPolicy = relatedPolicies[0];

                return (
                  <div key={message.id} className="space-y-4">
                    <ChatMessage message={message} />

                    {message.role === "assistant" && !message.isStreaming && (
                      <div className="space-y-4">
                        {relatedPolicies.length > 0 && (
                          <div className="grid gap-4 md:grid-cols-2">
                            {relatedPolicies.map((policy) => (
                              <PolicyCard key={policy.billId} policy={policy} />
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {quickActions.map((action) => {
                            const Icon = action.icon;
                            const target = action.to(firstPolicy?.billId);

                            return (
                              <Button
                                key={action.label}
                                variant="outline"
                                size="sm"
                                className="gap-2 rounded-full border-card-border/80 bg-card/70 backdrop-blur hover:border-primary hover:bg-primary/10 hover:text-primary"
                                onClick={() => navigate(target)}
                              >
                                <Icon className="h-4 w-4" />
                                {action.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isStreaming && (
                <Card className="glass border-card-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Analyzing your request…
                    </div>
                  </div>
                </Card>
              )}

              {logs.length > 0 && (
                <Card className="glass border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                  <p className="mb-2 text-sm font-semibold text-foreground">Orchestrator log</p>
                  <div className="space-y-1">
                    {logs.map((entry, index) => (
                      <p key={`${entry}-${index}`}>{entry}</p>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[60px] max-h-[200px] flex-1 resize-none rounded-2xl border-card-border bg-card/80 shadow-md backdrop-blur"
                rows={2}
                disabled={chatMutation.isPending || isStreaming}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending || isStreaming}
                className="gradient-primary px-6 text-primary-foreground shadow-glow transition-all hover:shadow-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground">
              <p>Press Enter to send, Shift+Enter for a new line</p>
              <p className="flex items-center gap-2">
                Powered by orchestrator intelligence
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
