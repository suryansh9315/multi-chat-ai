"use client";

import { useMemo, useState } from "react";
import { Lightbulb, BriefcaseBusiness, Dumbbell, Code2, Plane } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import {
  buildSessionConfig,
  sessionPersonas,
  type PersonaId,
} from "@/constants/sessionPersonas";
import type { ChatSessionConfig } from "@/types";

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sessionConfig: ChatSessionConfig) => Promise<void> | void;
}

const personaIcons = {
  "study-coach": Lightbulb,
  "code-mentor": Code2,
  "marketing-strategist": BriefcaseBusiness,
  "fitness-coach": Dumbbell,
  "travel-planner": Plane,
} satisfies Record<PersonaId, typeof Lightbulb>;

const NewSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
}: NewSessionModalProps) => {
  const [selectedPersona, setSelectedPersona] =
    useState<PersonaId>("study-coach");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewPrompt = useMemo(
    () => buildSessionConfig(selectedPersona, customInstructions).systemPrompt,
    [customInstructions, selectedPersona],
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await onSubmit(buildSessionConfig(selectedPersona, customInstructions));
      setCustomInstructions("");
      setSelectedPersona("study-coach");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Start a Topic Session</DialogTitle>
          <DialogDescription>
            Pick a persona, add any extra instructions, and we&apos;ll use that
            system prompt for the session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sessionPersonas.map((persona) => {
            const Icon = personaIcons[persona.id];
            const isSelected = selectedPersona === persona.id;

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => setSelectedPersona(persona.id)}
                className={cn(
                  "rounded-xl border text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <Card className="border-0 shadow-none h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {persona.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {persona.shortDescription}
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label htmlFor="session-instructions" className="text-sm font-medium">
            Session instructions
          </label>
          <Input
            id="session-instructions"
            placeholder="Example: Focus on beginner-friendly explanations for JavaScript arrays"
            value={customInstructions}
            onChange={(event) => setCustomInstructions(event.target.value)}
          />
        </div>

        <Card className="bg-muted/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">System prompt preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {previewPrompt}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Session"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSessionModal;
