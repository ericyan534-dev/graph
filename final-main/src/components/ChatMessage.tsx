import { Bot, User, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Citation {
  title: string;
  url?: string;
  content?: string;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

const ChatMessage = ({ role, content, citations }: ChatMessageProps) => {
  const isUser = role === 'user';

  // Extract inline citations from content (format: [Source: description])
  const extractCitations = (text: string) => {
    const citationRegex = /\[Source: ([^\]]+)\]/g;
    const matches = [...text.matchAll(citationRegex)];
    return matches.map(match => match[1]);
  };

  const inlineCitations = extractCitations(content);

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-primary shadow-glow' 
          : 'bg-card border-2 border-primary/20'
      }`}>
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-primary" />
        )}
      </div>
      
      <div className={`flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <Card className={`p-4 ${
          isUser 
            ? 'bg-primary text-primary-foreground ml-12' 
            : 'bg-card mr-12'
        }`}>
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
            {content}
          </div>
        </Card>

        {!isUser && inlineCitations.length > 0 && (
          <div className="flex flex-wrap gap-2 mr-12">
            {inlineCitations.map((citation, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs hover:bg-accent transition-colors cursor-default"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {citation}
              </Badge>
            ))}
          </div>
        )}

        {!isUser && citations && citations.length > 0 && (
          <div className="flex flex-wrap gap-2 mr-12">
            {citations.map((citation, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs hover:bg-accent transition-colors"
              >
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {citation.title}
                  </a>
                ) : (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {citation.title}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;