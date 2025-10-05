import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Dna, Network, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  hasLinks?: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome to PolyScope. Please search for a policy or ask me about legislation, stakeholder influence, or policy analysis.",
      timestamp: new Date(),
      hasLinks: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you're asking about "${input}". Let me help you with that. You can explore detailed analysis through our specialized tools:`,
        timestamp: new Date(),
        hasLinks: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
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
              <Badge className="bg-success/10 text-success border-success/20">
                <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-up`}
              >
                {message.role === "assistant" && (
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}

                <Card
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-card-border"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium opacity-70">
                        {message.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      <span className="text-xs opacity-50">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>

                    {/* Quick Action Links */}
                    {message.role === "assistant" && message.hasLinks && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                        <Link to="/dna">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                          >
                            <Dna className="h-4 w-4" />
                            View DNA Analysis
                          </Button>
                        </Link>
                        <Link to="/influence">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-accent/10 hover:text-accent hover:border-accent"
                          >
                            <Network className="h-4 w-4" />
                            Influence Tracker
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 hover:bg-success/10 hover:text-success hover:border-success"
                        >
                          <FileText className="h-4 w-4" />
                          Policy Search
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {message.role === "user" && (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start animate-fade-up">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <Card className="bg-card border-card-border">
                  <div className="p-4 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Analyzing your query...
                    </span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a policy or ask about legislation, stakeholders, or analysis..."
              className="min-h-[60px] max-h-[200px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 gradient-primary hover:shadow-glow transition-all"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <p>Press Enter to send, Shift+Enter for new line</p>
            <p className="flex items-center gap-2">
              Powered by AI
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
