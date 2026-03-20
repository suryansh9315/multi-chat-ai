"use client";
import { AIOption, Message } from "@/types";
import React, { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot, User } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentAI: AIOption;
}

const MessageList = ({ messages, isLoading, currentAI }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div className="space-y-4">
      {messages?.map((message) => (
        <div
          key={message?.id}
          className={`flex ${
            message.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex max-w-[80%] space-x-3 ${
              message.sender === "user"
                ? "flex-row-reverse space-x-reverse"
                : ""
            }`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className={
                  message.sender === "user"
                    ? "bg-blue-500"
                    : `bg-linear-to-r ${currentAI.color}`
                }
              >
                {message.sender === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </AvatarFallback>
            </Avatar>
            <Card
              className={
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : ""
              }
            >
              <CardContent className="px-3">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {message?.text}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {message.sender === "user" ? "You" : currentAI.name}
                  </Badge>
                  <span className="text-xs opacity-50">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="flex max-w-[80%] space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={`bg-linear-to-r ${currentAI.color}`}>
                <Bot className="h-4 w-4 text-white" />
              </AvatarFallback>
            </Avatar>
            <Card>
              <CardContent>
                <div className="flex items-center justify-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
