// lib/aiServices.ts
import type { OpenAIChatMessage } from "@/types";

export const callOpenAI = async (
  messages: OpenAIChatMessage[],
  model?: string,
) => {
  try {
    const response = await fetch("/api/ai/chatgpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`ChatGPT API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.text || "No response received",
      success: true,
    };
  } catch (error) {
    console.error("ChatGPT API error:", error);
    return {
      text: "",
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "Failed to get response from ChatGPT",
    };
  }
};
