import { useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PolicyCard } from "@/components/policy/PolicyCard";
import { ModeSelector } from "@/components/chat/ModeSelector";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
};

type Policy = {
  id: string;
  title: string;
  jurisdiction: string;
  status: string;
  lastAction: string;
  confidence: number;
  matchedSections: string[];
  messageId: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [mode, setMode] = useState<"describe" | "troubleshoot">("describe");

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate streaming response
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Simulate streaming
    const fullResponse =
      mode === "describe"
        ? `Based on your query about "${content}", I found several relevant policies. The Affordable Care Act (ACA) contains provisions matching your search criteria. According to Section 1201(4), states must establish health insurance marketplaces. This provision was inserted during the 111th Congress through amendment SA 2786.`
        : `To help you find what you're looking for, try: 1) Use the bill number format like "HR 1234" or "S 567", 2) Filter by Congress session (e.g., "118th Congress"), or 3) Search by specific policy area like "healthcare" or "education".`;

    let currentText = "";
    let index = 0;

    const streamInterval = setInterval(() => {
      if (index < fullResponse.length) {
        currentText += fullResponse[index];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: currentText }
              : msg
          )
        );
        index++;
      } else {
        clearInterval(streamInterval);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

        // Add policy cards after streaming completes (only in describe mode)
        if (mode === "describe") {
          setPolicies((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              title: "Affordable Care Act",
              jurisdiction: "Federal",
              status: "Active",
              lastAction: "Amendment vote - Passed",
              confidence: 94,
              year: 2010,
              matchedSections: [
                "Section 1201(4) - Marketplace establishment",
                "Section 1302 - Essential health benefits",
                "Section 1311 - State flexibility",
              ],
              messageId: assistantMessageId,
            },
            {
              id: (Date.now() + 1).toString(),
              title: "Social Security Act",
              jurisdiction: "Federal",
              status: "Active",
              lastAction: "Amended multiple times",
              confidence: 87,
              year: 1935,
              matchedSections: [
                "Title II - Federal Old-Age Benefits",
                "Title XVIII - Health Insurance for Aged",
                "Title XIX - Grants to States",
              ],
              messageId: assistantMessageId,
            },
          ]);
        }
      }
    }, 20);
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
                  {/* Show policy cards after this assistant message */}
                  {message.role === "assistant" && !message.isStreaming && (
                    <div className="mt-4 space-y-3">
                      {policies
                        .filter((p) => p.messageId === message.id)
                        .map((policy) => (
                          <PolicyCard key={policy.id} policy={policy} />
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <div className="border-t border-border bg-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <ChatInput
            onSend={handleSendMessage}
            disabled={messages.some((m) => m.isStreaming)}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
