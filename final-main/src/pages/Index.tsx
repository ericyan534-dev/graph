import { useEffect, useMemo, useRef, useState } from "react";
import { Brain } from "lucide-react";

import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import ConversationList from "@/components/ConversationList";
import LegitimacyWidget from "@/components/LegitimacyWidget";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { sendChat } from "@/lib/api";
import type { OrchestratorResponse, PolicySearchHit } from "@/types/orchestrator";

const STORAGE_KEY = "poliscope_conversations";

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  citations?: OrchestratorResponse["answer"]["citations"];
  guardrailWarnings?: string[];
  policies?: PolicySearchHit[];
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
  messages: Message[];
  logs: string[];
};

const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [mode, setMode] = useState<"describe" | "troubleshoot">("describe");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Conversation[];
      const normalised = parsed.map((conversation) => ({
        id: conversation.id ?? uuid(),
        title: conversation.title ?? "New Conversation",
        updated_at: conversation.updated_at ?? new Date().toISOString(),
        messages: (conversation.messages ?? []).map((message) => ({
          id: message.id ?? uuid(),
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content ?? "",
          timestamp: message.timestamp ?? new Date().toISOString(),
          citations: message.citations,
          guardrailWarnings: message.guardrailWarnings,
          policies: message.policies,
        })),
        logs: conversation.logs ?? [],
      }));

      const sorted = sortConversations(normalised);
      setConversations(sorted);
      if (sorted.length > 0) {
        setCurrentConversationId(sorted[0].id);
        setMessages(sorted[0].messages);
        setLogs(sorted[0].logs);
      }
    } catch (error) {
      console.error("Failed to parse stored conversations", error);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const persistConversations = (updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations((prev) => {
      const next = sortConversations(updater(prev));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!currentConversationId) return;
    const conversation = conversations.find((c) => c.id === currentConversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setLogs(conversation.logs);
    }
  }, [currentConversationId, conversations]);

  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = (): string => {
    const conversation: Conversation = {
      id: uuid(),
      title: "New Conversation",
      updated_at: new Date().toISOString(),
      messages: [],
      logs: [],
    };

    persistConversations((prev) => [conversation, ...prev]);
    setCurrentConversationId(conversation.id);
    setMessages([]);
    setLogs([]);
    return conversation.id;
  };

  const updateConversation = (
    conversationId: string,
    transform: (conversation: Conversation) => Conversation
  ) => {
    persistConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId ? transform(conversation) : conversation
      )
    );
  };

  const sendMessage = async (input: string) => {
    const content = input.trim();
    if (!content) return;

    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = createConversation();
    }

    if (!conversationId) return;

    setSending(true);

    const userMessage: Message = {
      id: uuid(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const withUser = [...messages, userMessage];
    setMessages(withUser);
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: withUser,
      title:
        conversation.messages.length === 0
          ? content.slice(0, 60) || "New Conversation"
          : conversation.title,
      updated_at: userMessage.timestamp,
    }));

    const assistantId = uuid();
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    const withAssistant = [...withUser, assistantPlaceholder];
    setMessages(withAssistant);
    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      messages: withAssistant,
      updated_at: assistantPlaceholder.timestamp,
    }));

    try {
      const response = await sendChat(content);

      setMessages((prev) => {
        const updated = prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: response.answer.answer,
                citations: response.answer.citations,
                guardrailWarnings: response.guardrail.warnings,
                policies: response.policies,
                isStreaming: false,
                timestamp: new Date().toISOString(),
              }
            : message
        );

        updateConversation(conversationId!, (conversation) => ({
          ...conversation,
          messages: updated,
          logs: response.logs ?? [],
          updated_at: new Date().toISOString(),
        }));

        setLogs(response.logs ?? []);
        return updated;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to contact the orchestrator.";

      toast({
        title: "Chat error",
        description: message,
        variant: "destructive",
      });

      setMessages((prev) => {
        const updated = prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: `Sorry, something went wrong: ${message}`,
                isStreaming: false,
              }
            : item
        );

        updateConversation(conversationId!, (conversation) => ({
          ...conversation,
          messages: updated,
          updated_at: new Date().toISOString(),
        }));

        return updated;
      });
    } finally {
      setSending(false);
    }
  };

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === currentConversationId),
    [conversations, currentConversationId]
  );

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <div className="w-80 hidden md:block">
        <ConversationList
          conversations={conversations.map(({ id, title, updated_at }) => ({
            id,
            title,
            updated_at,
          }))}
          currentConversationId={currentConversationId}
          onSelectConversation={setCurrentConversationId}
          onNewConversation={createConversation}
        />
      </div>
      <div className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-6 max-w-2xl animate-fade-in">
              <div className="flex justify-center">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
                  <Brain className="h-16 w-16 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3">
                  Welcome to PoliScope
                </h1>
                <p className="text-lg text-muted-foreground">
                  AI-powered legislative intelligence with cited sourcing
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">Policy Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Summaries, comparisons, and change tracking for bills across jurisdictions
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">Grounded Answers</h3>
                  <p className="text-sm text-muted-foreground">
                    Each response is linked to verifiable citations from the orchestrator stack
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">Policy DNA</h3>
                  <p className="text-sm text-muted-foreground">
                    Jump into transparency mode to inspect authorship, influence, and version history
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {activeConversation && (
                <div className="text-sm text-muted-foreground">
                  Conversation updated {new Date(activeConversation.updated_at).toLocaleString()}
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    citations={message.citations?.map((citation) => ({
                      title: citation.label,
                      url: citation.url,
                    }))}
                    isStreaming={message.isStreaming}
                    guardrailWarnings={message.guardrailWarnings}
                  />
                  {message.role === "assistant" &&
                    !message.isStreaming &&
                    message.policies &&
                    message.policies.length > 0 && (
                      <div className="grid gap-4">
                        {message.policies.map((policy) => (
                          <PolicyCard key={`${message.id}-${policy.billId}`} policy={policy} />
                        ))}
                      </div>
                    )}
                </div>
              ))}
              {logs.length > 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Orchestrator log</p>
                  {logs.map((entry, index) => (
                    <p key={index}>{entry}</p>
                  ))}
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}

        <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Search Legitimacy (Describe mode)</div>
                <p className="text-xs text-muted-foreground">
                  Evaluate a claim before sending it to the assistant for further analysis.
                </p>
              </div>
              <ModeSelector mode={mode} onModeChange={setMode} />
            </div>
            <LegitimacyWidget />
            <ChatInput onSendMessage={sendMessage} loading={sending} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
