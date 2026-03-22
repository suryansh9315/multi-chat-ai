import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { OpenAIChatMessage } from "@/types";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      model = "gpt-4o-mini",
    }: { messages?: OpenAIChatMessage[]; model?: string } =
      await request.json();

    if (!messages?.length) {
      return NextResponse.json(
        {
          error: "Messages are required",
        },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      messages,
      model,
      max_tokens: 1000,
      temperature: 0.7,
    });
    const text =
      completion.choices[0]?.message?.content || "No response received";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("ChatGPT API error:", error);
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : undefined;
    return NextResponse.json(
      { error: errorMessage || "Failed to get response from ChatGPT" },
      { status: 500 },
    );
  }
}
