import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import LegitimacyWidget from "@/components/LegitimacyWidget";
import ConversationList from "@/components/ConversationList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  messages: Message[];
}

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        setMessages(conversation.messages);
      }
    }
  }, [currentConversationId, conversations]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = () => {
    const saved = localStorage.getItem('poliscope_conversations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0 && !currentConversationId) {
        setCurrentConversationId(parsed[0].id);
      }
    }
  };

  const saveConversations = (convos: Conversation[]) => {
    localStorage.setItem('poliscope_conversations', JSON.stringify(convos));
    setConversations(convos);
  };

  const createConversation = (): string => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      updated_at: new Date().toISOString(),
      messages: [],
    };
    const updated = [newConversation, ...conversations];
    saveConversations(updated);
    setCurrentConversationId(newConversation.id);
    setMessages([]);
    return newConversation.id;
  };

  const updateConversation = (conversationId: string, newMessages: Message[]) => {
    const updated = conversations.map(c => 
      c.id === conversationId 
        ? { 
            ...c, 
            messages: newMessages,
            title: newMessages[0]?.content.slice(0, 50) || 'New Conversation',
            updated_at: new Date().toISOString(),
          }
        : c
    );
    saveConversations(updated);
  };

  const sendMessage = async (content: string) => {
    let convId = currentConversationId;
    if (!convId) {
      convId = createConversation();
    }

    setSending(true);
    try {
      const userMessage: Message = {
        role: 'user',
        content,
        id: crypto.randomUUID(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      updateConversation(convId!, newMessages);

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          conversationId: convId,
        },
      });

      if (error) throw error;

      if (data?.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
          id: crypto.randomUUID(),
        };
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        updateConversation(convId!, finalMessages);
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to get response", 
        variant: "destructive" 
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 hidden md:block">
        <ConversationList
          conversations={conversations}
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
                  AI-Powered Political Analysis & Policy Research
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">Policy Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get in-depth analysis of political policies and their impacts
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">Cited Sources</h3>
                  <p className="text-sm text-muted-foreground">
                    All insights backed by verifiable sources and data
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all">
                  <h3 className="font-semibold mb-2">Balanced Views</h3>
                  <p className="text-sm text-muted-foreground">
                    Objective analysis presenting multiple perspectives
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}

<div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="max-w-4xl mx-auto grid gap-3">
    <div className="text-sm font-semibold">Search Legitimacy (Describe mode)</div>
    <LegitimacyWidget />
    <ChatInput onSendMessage={sendMessage} loading={sending} />
  </div>
</div>

      </div>
    </div>
  );
};

export default Index;
