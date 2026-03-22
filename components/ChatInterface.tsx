"use client";

import { ChevronDown, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import React, {
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
  useRef,
} from "react";
import { Badge } from "./ui/badge";
import ModeToggle from "./ModeToggle";
import { aiOptions } from "@/constants/data";
import NewSessionModal from "./NewSessionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { AIProvider, ChatSessionConfig, Message, User } from "@/types";
import { ScrollArea } from "./ui/scroll-area";
import MessageList from "./MessageList";

interface ChatInterfaceProps {
  messages: Message[];
  isAnonymous: boolean;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<string | null>;
  selectedAI: AIProvider;
  setSelectedAI: Dispatch<SetStateAction<AIProvider>>;
  user: User | null;
  currentChatId: string | null;
  currentSessionConfig: ChatSessionConfig;
  startNewSession: (sessionConfig: ChatSessionConfig) => Promise<string | null>;
  routerPush: (url: string) => void;
}

const ChatInterface = ({
  messages,
  isAnonymous,
  isLoading,
  sendMessage,
  selectedAI,
  setSelectedAI,
  user,
  currentChatId,
  currentSessionConfig,
  startNewSession,
  routerPush,
}: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentAI =
    aiOptions.find((ai) => ai.id === selectedAI) || aiOptions[0];

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    try {
      const createdChatId = await sendMessage(inputMessage);
      setInputMessage("");
      inputRef.current?.focus();

      if (user && !isAnonymous && !currentChatId && createdChatId) {
        routerPush(`/chat/${createdChatId}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex min-h-0 h-full w-full flex-1 flex-col overflow-hidden bg-background">
      <header className="border-b bg-card/50 px-4 backdrop-blur supports-backdrop-filter:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="ml-8 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-pink-500 lg:ml-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center">
                  <h1 className="hidden text-lg font-semibold sm:block">
                    AI Chat Hub
                  </h1>
                  <Badge
                    variant={isAnonymous ? "secondary" : "default"}
                    className="border border-primary/50 md:ml-2"
                  >
                    {isAnonymous ? "Anonymous" : "Signed In"}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {currentSessionConfig.personaLabel}
                  </Badge>
                </div>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Multiple AI assistants in one place
                </p>
              </div>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <Button
              variant="outline"
              onClick={() => setShowSessionModal(true)}
              className="hidden sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              New Session
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="max-w-50 justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`rounded-sm bg-linear-to-r p-1 ${currentAI.color}`}
                    >
                      <currentAI.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <span>{currentAI.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mr-3 w-60">
                {aiOptions.map((ai) => (
                  <DropdownMenuItem
                    key={ai.id}
                    onClick={() => setSelectedAI(ai.id)}
                  >
                    <div className="flex items-center space-x-3 p-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r ${ai.color}`}
                      >
                        <ai.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-medium">{ai.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {ai.description}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-6">
        <div className="flex min-h-0 h-full w-full flex-col justify-between space-y-6">
          {messages.length === 0 && (
            <div>
              <div className="mb-6 rounded-xl border border-purple-500/20 bg-linear-to-r from-purple-500/10 to-pink-500/10 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-primary">
                      Welcome to AI Chat Hub
                    </h3>
                    <p className="mb-2 text-sm text-primary/80">
                      {isAnonymous
                        ? "You're chatting anonymously. Messages won't be saved unless you sign in."
                        : "You're signed in. Your chat history will be saved automatically."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 text-xs">
                        Persona: {currentSessionConfig.personaLabel}
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 text-xs">
                        Type a message below to start
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 text-xs">
                        Switch AI models anytime
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="space-y-4 text-center">
                    <div
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r ${currentAI.color}`}
                    >
                      <currentAI.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Chat with {currentAI.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {currentAI.description}
                      </p>
                    </div>
                    <div className="mx-auto grid max-w-lg grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
                      {[
                        "What can you help me with?",
                        "Explain quantum computing",
                        "Write a creative story",
                        "Help me code a function",
                      ].map((prompt) => (
                        <Button
                          key={prompt}
                          onClick={() => setInputMessage(prompt)}
                          variant="ghost"
                          className="h-auto justify-start border p-3 text-left"
                        >
                          <span>{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {messages.length > 0 && (
            <Card className="flex min-h-0 flex-1 flex-col">
              <CardContent className="border-b bg-muted/20 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    Persona: {currentSessionConfig.personaLabel}
                  </Badge>
                  {currentSessionConfig.customInstructions && (
                    <span className="text-sm text-muted-foreground">
                      {currentSessionConfig.customInstructions}
                    </span>
                  )}
                </div>
              </CardContent>
              <ScrollArea className="min-h-0 flex-1 p-4">
                <MessageList
                  messages={messages}
                  isLoading={isLoading}
                  currentAI={currentAI}
                />
              </ScrollArea>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    placeholder={`Message ${currentAI.name}...`}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="min-h-12"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-12 w-12"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewSessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSubmit={async (sessionConfig) => {
          const newChatId = await startNewSession(sessionConfig);

          if (newChatId && newChatId !== "anonymous") {
            routerPush(`/chat/${newChatId}`);
          }
        }}
      />
    </div>
  );
};

export default ChatInterface;
