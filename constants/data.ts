import { AIOption } from "@/types";
import { MessageCircle } from "lucide-react";

export const aiOptions: AIOption[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: MessageCircle,
    color: "from-green-400 to-emerald-500",
    description: "OpenAI's powerful language model",
  },
];
