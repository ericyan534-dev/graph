import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Calendar, Users, Tag, Send, Bot, User, Loader2, FileText } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SAMPLE_POLICIES = [
  {
    id: "HR-2024-001",
    title: "Infrastructure Investment and Jobs Act",
    summary: "Comprehensive infrastructure modernization including roads, bridges, broadband, and clean energy initiatives.",
    status: "Active",
    date: "2024-01-15",
    sponsors: 42,
    category: "Infrastructure",
  },
  {
    id: "SB-2024-089",
    title: "Healthcare Accessibility Reform",
    summary: "Expanding healthcare coverage and reducing prescription drug costs for Medicare recipients.",
    status: "In Committee",
    date: "2024-02-20",
    sponsors: 28,
    category: "Healthcare",
  },
  {
    id: "HR-2023-456",
    title: "Climate Action and Innovation Initiative",
    summary: "Promoting clean energy transition, carbon reduction targets, and green technology investments.",
    status: "Passed",
    date: "2023-11-08",
    sponsors: 35,
    category: "Environment",
  },
];

const PolicySearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPolicies, setFilteredPolicies] = useState(SAMPLE_POLICIES);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I can help you search and understand policies. Ask me anything about the policies in our database.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    const filtered = SAMPLE_POLICIES.filter(
      (policy) =>
        policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPolicies(filtered);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I found information about "${chatInput}". Based on our policy database, I can help you explore related legislation and analysis.`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/10 text-success border-success/20";
      case "Passed":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "In Committee":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* Policy Search Panel */}
      <div className="space-y-6 overflow-y-auto">
        <Card className="p-6 glass border-card-border">
          <div className="flex gap-3">
            <Input
              placeholder="Search policies by title, category, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="gradient-primary gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredPolicies.map((policy) => (
            <Card
              key={policy.id}
              className="glass border-card-border hover:shadow-glow transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {policy.id}
                      </Badge>
                      <Badge className={getStatusColor(policy.status)}>
                        {policy.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{policy.title}</h3>
                    <p className="text-sm text-muted-foreground">{policy.summary}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary/40 flex-shrink-0" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(policy.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{policy.sponsors} sponsors</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    <Tag className="h-3 w-3 mr-1" />
                    {policy.category}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredPolicies.length === 0 && (
          <Card className="p-12 text-center glass border-card-border">
            <p className="text-muted-foreground">No policies found matching your search.</p>
          </Card>
        )}
      </div>

      {/* AI Chatbot Panel */}
      <div className="flex flex-col h-full">
        <Card className="flex-1 flex flex-col glass border-card-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Policy Assistant</h3>
                <p className="text-xs text-muted-foreground">Ask me about policies</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-up`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                <Card
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/50"
                  }`}
                >
                  <div className="p-3">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-50 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </Card>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start animate-fade-up">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <Card className="bg-card/50">
                  <div className="p-3 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask about policies..."
                className="min-h-[60px] max-h-[120px] resize-none"
                rows={2}
              />
              <Button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || isLoading}
                className="gradient-primary"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PolicySearch;
