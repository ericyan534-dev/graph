import { User, Bot, Link2, ShieldAlert } from "lucide-react";
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

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-soft">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-soft ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border border-border"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
            )}
          </p>
        </div>

        {!isUser && !message.isStreaming && message.citations && (
          <div className="flex flex-wrap gap-2 px-2">
            {message.citations.map((citation) => (
              <a
                key={citation.url}
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <Link2 className="h-3 w-3" />
                {citation.label}
              </a>
            ))}
          </div>
        )}

        {!isUser && message.guardrailWarnings && message.guardrailWarnings.length > 0 && (
          <div className="flex items-center gap-2 px-2 text-xs text-amber-600">
            <ShieldAlert className="h-3 w-3" />
            <span>{message.guardrailWarnings.join(" · ")}</span>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center shadow-soft">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};
