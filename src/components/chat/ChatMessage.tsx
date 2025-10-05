import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, ExternalLink, ShieldAlert } from "lucide-react";
import type { OrchestratorResponse } from "@/types/orchestrator";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  citations?: OrchestratorResponse["answer"]["citations"];
  guardrailWarnings?: string[];
};

type ChatMessageProps = {
  message: Message;
};

const extractInlineCitations = (content: string) => {
  const citationRegex = /\[Source: ([^\]]+)\]/g;
  const matches = [...content.matchAll(citationRegex)];
  return matches.map((match) => match[1]);
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const inlineCitations = extractInlineCitations(message.content);

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in`}>
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-gradient-primary shadow-glow" : "border-2 border-primary/20 bg-card"
        }`}
      >
        {isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-primary" />}
      </div>

      <div className={`flex flex-1 flex-col space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <Card
          className={`p-4 ${
            isUser ? "ml-12 bg-primary text-primary-foreground" : "mr-12 bg-card text-card-foreground"
          }`}
        >
          <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
            {message.content}
            {message.isStreaming && (
              <span className="ml-1 inline-flex h-4 w-2 animate-pulse rounded-sm bg-current/60 align-middle" />
            )}
          </div>
        </Card>

        {!isUser && inlineCitations.length > 0 && (
          <div className="mr-12 flex flex-wrap gap-2">
            {inlineCitations.map((citation, index) => (
              <Badge
                key={`inline-${index}`}
                variant="secondary"
                className="cursor-default text-xs transition-colors hover:bg-accent"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                {citation}
              </Badge>
            ))}
          </div>
        )}

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mr-12 flex flex-wrap gap-2">
            {message.citations.map((citation, index) => (
              <Badge
                key={`citation-${citation.url ?? index}`}
                variant="secondary"
                className="text-xs transition-colors hover:bg-accent"
              >
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {citation.label}
                  </a>
                ) : (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {citation.label}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        )}

        {!isUser && message.guardrailWarnings && message.guardrailWarnings.length > 0 && (
          <div className="mr-12 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/30">
            <ShieldAlert className="h-3 w-3" />
            <span>{message.guardrailWarnings.join(" · ")}</span>
          </div>
        )}
      </div>
    </div>
  );
};
