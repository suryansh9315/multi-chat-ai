import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ChatSidebar from "@/components/ChatSidebar";
import { AuthProvider } from "@/hooks/useAuth";
import { ChatProvider } from "@/hooks/useChat";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chat Hub - Multiple AI Assistants",
  description:
    "Chat with ChatGPT, Claude, Grok, and Gemini all in one place. Multiple AI assistants with seamless switching and conversation history.",
  keywords: [
    "AI chat",
    "ChatGPT",
    "Claude",
    "Grok",
    "Gemini",
    "AI assistant",
    "conversation",
  ],
  authors: [{ name: "Suryansh Sharma" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.className} antialiased`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ChatProvider>
              <div className="min-h-screen flex">
                <ChatSidebar />
                {children}
              </div>
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
