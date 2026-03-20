import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, model = "gpt-3.5-turbo" } = await request.json();
    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required",
        },
        { status: 400 },
      );
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
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
