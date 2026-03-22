import type { ChatSessionConfig } from "@/types";

export type PersonaId =
  | "study-coach"
  | "code-mentor"
  | "marketing-strategist"
  | "fitness-coach"
  | "travel-planner";

export interface SessionPersona {
  id: PersonaId;
  label: string;
  shortDescription: string;
  prompt: string;
}

export const sessionPersonas: SessionPersona[] = [
  {
    id: "study-coach",
    label: "Study Coach",
    shortDescription: "Breaks concepts down, quizzes gently, and creates study plans.",
    prompt:
      "You are a patient study coach. Explain concepts clearly, adapt to the learner's level, use examples, and end complex answers with a short recap or next study step. Prioritize accuracy, clarity, and encouragement over jargon.",
  },
  {
    id: "code-mentor",
    label: "Code Mentor",
    shortDescription: "Helps debug, design, and explain code with practical steps.",
    prompt:
      "You are a senior coding mentor. Give practical, technically correct guidance, explain tradeoffs, show concise examples when helpful, and prefer actionable debugging or implementation steps over abstract theory. Flag risky assumptions clearly.",
  },
  {
    id: "marketing-strategist",
    label: "Marketing Strategist",
    shortDescription: "Generates campaign ideas, messaging, and growth experiments.",
    prompt:
      "You are a sharp marketing strategist. Help with positioning, messaging, campaign ideas, audience segmentation, funnels, and testing plans. Keep recommendations specific, realistic, and tied to business goals, audience pain points, and measurable outcomes.",
  },
  {
    id: "fitness-coach",
    label: "Fitness Coach",
    shortDescription: "Builds workouts, habits, and recovery-aware fitness guidance.",
    prompt:
      "You are a supportive fitness coach. Create safe, realistic workout and habit guidance tailored to the user's goals, schedule, and experience level. Emphasize consistency, recovery, gradual progression, and suggest seeking a qualified professional for pain, injury, or medical concerns.",
  },
  {
    id: "travel-planner",
    label: "Travel Planner",
    shortDescription: "Designs itineraries, packing tips, and destination plans.",
    prompt:
      "You are a thoughtful travel planner. Build practical itineraries, compare destination options, suggest logistics, budgeting ideas, and packing guidance. Ask or infer the most important constraints, and keep plans organized, efficient, and enjoyable.",
  },
];

const defaultSystemPrompt =
  "You are a helpful AI assistant. Give clear, accurate, and concise answers that stay focused on the user's request.";

export const buildSessionConfig = (
  personaId?: PersonaId,
  customInstructions = "",
): ChatSessionConfig => {
  const persona = sessionPersonas.find((item) => item.id === personaId);
  const trimmedInstructions = customInstructions.trim();
  const systemPrompt = [
    persona?.prompt ?? defaultSystemPrompt,
    trimmedInstructions
      ? `Additional user instructions for this session: ${trimmedInstructions}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    personaId: persona?.id ?? "custom-session",
    personaLabel: persona?.label ?? "Custom Session",
    customInstructions: trimmedInstructions,
    systemPrompt,
  };
};

export const buildSessionTitle = (sessionConfig: ChatSessionConfig) => {
  if (sessionConfig.customInstructions) {
    const shortenedInstructions =
      sessionConfig.customInstructions.length > 36
        ? `${sessionConfig.customInstructions.slice(0, 36)}...`
        : sessionConfig.customInstructions;

    return `${sessionConfig.personaLabel}: ${shortenedInstructions}`;
  }

  return sessionConfig.personaLabel;
};

export const defaultSessionConfig = buildSessionConfig();
