import { type ReactNode } from "react";
import { User, Bot, Link2, ShieldAlert, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
  children?: ReactNode;
};

export const ChatMessage = ({ message, children }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const isStreaming = message.role === "assistant" && message.isStreaming;

  const timestampLabel = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex gap-4 animate-fade-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}

      <Card
        className={cn(
          "max-w-[80%] overflow-hidden border transition-all",
          isUser
            ? "border-none bg-gradient-primary text-primary-foreground shadow-glow"
            : "border-card-border bg-card shadow-lg"
        )}
      >
        <div className="space-y-3 p-4">
          <div
            className={cn(
              "flex items-center gap-2 text-xs",
              isUser ? "justify-end text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            <span>{isUser ? "You" : "PolyScope AI"}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-mono text-[0.7rem] sm:text-[0.75rem]">
              {timestampLabel}
            </span>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {isStreaming && !message.content ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Analyzing your query...
              </span>
            ) : (
              <p>{message.content}</p>
            )}
          </div>

          {children}

          {!isUser && !isStreaming && message.citations && message.citations.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
              {message.citations.map((citation) => (
                <a
                  key={citation.url}
                  href={citation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Link2 className="h-3 w-3" />
                  {citation.label}
                </a>
              ))}
            </div>
          )}

          {!isUser && message.guardrailWarnings && message.guardrailWarnings.length > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              <ShieldAlert className="h-3 w-3" />
              <span className="font-medium">{message.guardrailWarnings.join(" · ")}</span>
            </div>
          )}
        </div>
      </Card>

      {isUser && (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary shadow-md">
          <User className="h-5 w-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};
