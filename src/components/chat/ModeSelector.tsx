import { MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModeSelectorProps = {
  mode: "describe" | "troubleshoot";
  onModeChange: (mode: "describe" | "troubleshoot") => void;
};

export const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  const baseClasses =
    "rounded-full px-4 text-xs font-semibold transition-all sm:text-sm";

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange("describe")}
        className={cn(
          baseClasses,
          "gap-2",
          mode === "describe"
            ? "bg-gradient-primary text-primary-foreground shadow-glow hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MessageSquare className="h-4 w-4" />
        Describe
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange("troubleshoot")}
        className={cn(
          baseClasses,
          "gap-2",
          mode === "troubleshoot"
            ? "bg-gradient-primary text-primary-foreground shadow-glow hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <HelpCircle className="h-4 w-4" />
        Troubleshoot
      </Button>
    </div>
  );
};
