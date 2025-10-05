import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
};

type ConversationListProps = {
  conversations: ConversationSummary[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
};

const ConversationList = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) => {
  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="space-y-3 border-b p-4">
        <h2 className="bg-gradient-primary bg-clip-text text-lg font-semibold text-transparent">
          PoliScope AI
        </h2>
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-primary transition-opacity hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No conversations yet.
              <br />
              Start a new chat!
            </div>
          ) : (
            conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer p-3 transition-all hover:shadow-md ${
                  currentConversationId === conversation.id
                    ? "border-primary/50 bg-accent shadow-glow"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
