"use client";

import {
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "./AuthModal";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ScrollArea } from "./ui/scroll-area";
import { Chat, ChatSessionConfig } from "@/types";
import { toast } from "sonner";
import NewSessionModal from "./NewSessionModal";

const ChatSidebar = () => {
  const { user, signOut } = useAuth();
  const {
    currentChatId,
    deleteChat,
    isAnonymous,
    startNewSession,
    chats,
    selectChat,
  } = useChat();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const router = useRouter();

  const handleCreateSession = async (sessionConfig: ChatSessionConfig) => {
    const newChatId = await startNewSession(sessionConfig);

    if (newChatId && newChatId !== "anonymous") {
      router.push(`/chat/${newChatId}`);
      return;
    }

    router.push("/");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="max-h-screen">
      <div className="hidden h-full lg:flex lg:w-80 lg:flex-col lg:border-r">
        <div className="flex h-full flex-col">
          <div className="p-4">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">AI Chat Hub</span>
            </Link>
            <Button
              onClick={() => setShowSessionModal(true)}
              className="w-full"
              variant="outline"
            >
              <Plus />
              New Session
            </Button>
          </div>
          <Separator />

          {isAnonymous && (
            <div className="p-4">
              <Card className="border">
                <CardContent className="p-3">
                  <p className="mb-2 text-sm text-destructive">
                    You&apos;re chatting anonymously
                  </p>
                  <p className="mb-3 text-xs">
                    Sign in to save your chat history
                  </p>
                  <Button
                    onClick={() => {
                      setAuthMode("signin");
                      setShowAuthModal(true);
                    }}
                    className="w-full"
                    variant="outline"
                    size="sm"
                  >
                    <LogIn />
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex-1 overflow-hidden p-4">
            <ScrollArea className="h-full">
              {chats.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isAnonymous ? "No saved chats" : "No chats yet"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAnonymous
                      ? "Sign in to save conversations"
                      : "Start a conversation to see your chats here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat: Chat) => (
                    <Card
                      key={chat.id}
                      className={`group cursor-pointer transition-colors ${
                        currentChatId === chat.id
                          ? "border-accent-foreground/20 bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => {
                        selectChat(chat.id);
                        router.push(`/chat/${chat.id}`);
                      }}
                    >
                      <CardContent className="px-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-medium">
                              {chat.title}
                            </h4>
                            <div className="mt-1 flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {chat.aiProvider}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {chat.messageCount} messages
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteChat(chat.id);
                              toast("Chat deleted successfully!");
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator />

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={isAnonymous ? "bg-yellow-500" : "bg-blue-500"}
                  >
                    <User className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-h-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">
                    {user?.displayName ||
                      user?.email?.split("@")[0] ||
                      "Anonymous User"}
                  </p>
                  <div className="mt-0.5 flex items-center space-x-1">
                    <Badge variant={isAnonymous ? "secondary" : "default"}>
                      {isAnonymous ? "Anonymous" : "Signed In"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                {isAnonymous ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAuthMode("signin");
                      setShowAuthModal(true);
                    }}
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onSwitchMode={() =>
          setAuthMode(authMode === "signin" ? "signup" : "signin")
        }
      />
      <NewSessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSubmit={handleCreateSession}
      />
    </div>
  );
};

export default ChatSidebar;
