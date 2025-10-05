import { MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModeSelectorProps = {
  mode: "describe" | "troubleshoot";
  onModeChange: (mode: "describe" | "troubleshoot") => void;
};

export const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={mode === "describe" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("describe")}
        className="gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Describe
      </Button>
      <Button
        variant={mode === "troubleshoot" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("troubleshoot")}
        className="gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        Troubleshoot
      </Button>
    </div>
  );
};
