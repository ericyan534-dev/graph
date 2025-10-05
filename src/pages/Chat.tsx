import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Brain } from "lucide-react";

import ConversationList, { ConversationSummary } from "@/components/ConversationList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ModeSelector } from "@/components/chat/ModeSelector";
import LegitimacyWidget from "@/components/LegitimacyWidget";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const ACTIVE_CONVERSATION_ID = "active";

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [mode, setMode] = useState<"describe" | "troubleshoot">("describe");
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (input: { content: string; assistantId: string }) => {
      const response = await sendChat(input.content);
      return { response, assistantId: input.assistantId };
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
        ...response.policies.map((policy) => ({ ...policy, messageId: assistantId })),
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

  const resetConversation = () => {
    setMessages([]);
    setPolicies([]);
    setLogs([]);
  };

  const conversation: ConversationSummary | null = useMemo(() => {
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    const firstUserMessage = messages.find((message) => message.role === "user");
    return {
      id: ACTIVE_CONVERSATION_ID,
      title: firstUserMessage?.content.slice(0, 60) || "New Conversation",
      updated_at: lastMessage.timestamp.toISOString(),
    };
  }, [messages]);

  const isSending = chatMutation.isPending || messages.some((message) => message.isStreaming);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <div className="hidden w-80 md:block">
        <ConversationList
          conversations={conversation ? [conversation] : []}
          currentConversationId={conversation ? ACTIVE_CONVERSATION_ID : undefined}
          onSelectConversation={() => undefined}
          onNewConversation={resetConversation}
        />
      </div>

      <div className="flex flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-2xl space-y-6 text-center animate-fade-in">
              <div className="flex justify-center">
                <div className="rounded-3xl bg-gradient-primary p-6 shadow-glow">
                  <Brain className="h-16 w-16 text-white" />
                </div>
              </div>
              <div>
                <h1 className="mb-3 text-4xl font-bold text-transparent bg-gradient-primary bg-clip-text">
                  Welcome to PoliScope
                </h1>
                <p className="text-lg text-muted-foreground">
                  AI-powered legislative intelligence with cited sourcing
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50">
                  <h3 className="mb-2 font-semibold">Policy Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Summaries, comparisons, and change tracking for bills across jurisdictions
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50">
                  <h3 className="mb-2 font-semibold">Grounded Answers</h3>
                  <p className="text-sm text-muted-foreground">
                    Each response is linked to verifiable citations from the orchestrator stack
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50">
                  <h3 className="mb-2 font-semibold">Policy DNA</h3>
                  <p className="text-sm text-muted-foreground">
                    Jump into transparency mode to inspect authorship, influence, and version history
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              {conversation && (
                <div className="text-sm text-muted-foreground">
                  Conversation updated {new Date(conversation.updated_at).toLocaleString()}
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <ChatMessage message={message} />
                  {message.role === "assistant" && !message.isStreaming && (
                    <div className="grid gap-4">
                      {policies
                        .filter((policy) => policy.messageId === message.id)
                        .map((policy) => (
                          <PolicyCard key={`${message.id}-${policy.billId}`} policy={policy} />
                        ))}
                    </div>
                  )}
                </div>
              ))}
              {logs.length > 0 && (
                <div className="space-y-1 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Orchestrator log</p>
                  {logs.map((entry, index) => (
                    <p key={`log-${index}`}>{entry}</p>
                  ))}
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}

        <div className="border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Search Legitimacy ({mode === "describe" ? "Describe" : "Troubleshoot"} mode)</div>
                <p className="text-xs text-muted-foreground">
                  Evaluate a claim before sending it to the assistant for further analysis.
                </p>
              </div>
              <ModeSelector mode={mode} onModeChange={setMode} />
            </div>
            <LegitimacyWidget />
            <ChatInput onSend={handleSendMessage} disabled={isSending} isLoading={isSending} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
