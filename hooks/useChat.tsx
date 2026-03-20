"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  addMessage,
  createChat,
  subscribeToMessages,
  subscribeToUserChatsSimple,
  deleteChat as deleteChatFromDB,
} from "@/lib/firestore";
import { callOpenAI } from "@/lib/aiServices";
import { Message, Chat, AIProvider } from "@/types";

export const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAI, setSelectedAI] = useState<AIProvider>("chatgpt");
  const [anonymousMessages, setAnonymousMessages] = useState<Message[]>([]);

  // Subscribe to user's chats (only for authenticated users)
  useEffect(() => {
    if (!user || user.isAnonymous) {
      setChats([]);
      setCurrentChatId(null);
      return;
    }

    const unsubscribe = subscribeToUserChatsSimple(user.uid, (userChats) => {
      setChats(userChats);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages of current chat (only for authenticated users)
  useEffect(() => {
    if (!currentChatId || !user || user.isAnonymous) {
      if (!user?.isAnonymous) {
        setMessages([]);
      }
      return;
    }

    const unsubscribe = subscribeToMessages(currentChatId, (chatMessages) => {
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [currentChatId, user]);

  // Handle anonymous user messages
  useEffect(() => {
    if (user?.isAnonymous) {
      setMessages(anonymousMessages);
    }
  }, [anonymousMessages, user]);

  // Reset state when user changes
  useEffect(() => {
    if (user?.isAnonymous) {
      setCurrentChatId(null);
      setMessages(anonymousMessages);
    } else if (user) {
      setMessages([]);
    } else {
      setCurrentChatId(null);
      setMessages([]);
      setAnonymousMessages([]);
    }
  }, [user?.uid, user?.isAnonymous]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !user) return;

      setIsLoading(true);

      try {
        if (user.isAnonymous) {
          const userMessage: Message = {
            id: `msg_${Date.now()}`,
            text,
            sender: "user",
            timestamp: new Date().toISOString(),
            ai: selectedAI,
            chatId: "anonymous",
            userId: user.uid,
          };

          setAnonymousMessages((prev) => [...prev, userMessage]);

          const aiResponse = await callOpenAI(text, selectedAI);

          const aiMessage: Message = {
            id: `msg_${Date.now() + 1}`,
            text: aiResponse.success
              ? aiResponse.text
              : `Sorry, I encountered an error: ${aiResponse.error}`,
            sender: "ai",
            timestamp: new Date().toISOString(),
            ai: selectedAI,
            chatId: "anonymous",
            userId: user.uid,
          };

          setAnonymousMessages((prev) => [...prev, aiMessage]);
        } else {
          let chatId = currentChatId;

          if (!chatId) {
            const chatTitle =
              text.length > 50 ? text.substring(0, 50) + "..." : text;
            chatId = await createChat(chatTitle, selectedAI, user.uid);
            setCurrentChatId(chatId);
          }

          await addMessage(chatId, text, "user", selectedAI, user.uid);

          const aiResponse = await callOpenAI(text, selectedAI);

          const responseText = aiResponse.success
            ? aiResponse.text
            : `Sorry, I encountered an error: ${aiResponse.error}`;

          await addMessage(chatId, responseText, "ai", selectedAI, user.uid);
        }
      } catch (error) {
        console.error("Error sending message:", error);

        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          text: "Sorry, something went wrong. Please try again.",
          sender: "ai",
          timestamp: new Date().toISOString(),
          ai: selectedAI,
          chatId: user.isAnonymous ? "anonymous" : currentChatId || "unknown",
          userId: user.uid,
        };

        if (user.isAnonymous) {
          setAnonymousMessages((prev) => [...prev, errorMessage]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [currentChatId, selectedAI, user, isLoading],
  );

  const createNewChat = useCallback(async () => {
    if (!user) {
      console.log("No user available");
      return null;
    }

    if (user.isAnonymous) {
      console.log("Clearing anonymous messages");
      setAnonymousMessages([]);
      setCurrentChatId(null);
      setMessages([]);
      return "anonymous";
    } else {
      console.log("Creating new chat in Firestore");
      const chatTitle = "New Chat";
      const chatId = await createChat(chatTitle, selectedAI, user.uid);
      setCurrentChatId(chatId);
      setMessages([]);
      return chatId;
    }
  }, [user, selectedAI]);

  const selectChat = useCallback(
    (chatId: string) => {
      if (!user || user.isAnonymous) {
        console.log("Cannot select chat - user is anonymous or not logged in");
        return;
      }

      setCurrentChatId(chatId);
      // setMessages([]);
    },
    [user, chats],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      if (!user || user.isAnonymous) {
        console.log("Cannot delete chat - user is anonymous or not logged in");
        return;
      }

      console.log("Deleting chat:", chatId);

      try {
        await deleteChatFromDB(chatId);

        if (currentChatId === chatId) {
          console.log("Deleted current chat, resetting state");
          setCurrentChatId(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
      }
    },
    [currentChatId, user],
  );

  const clearAnonymousChat = useCallback(() => {
    if (user?.isAnonymous) {
      setAnonymousMessages([]);
    }
  }, [user]);

  return {
    messages: user?.isAnonymous ? anonymousMessages : messages,
    chats: user?.isAnonymous ? [] : chats,
    currentChatId: user?.isAnonymous ? null : currentChatId,
    isLoading,
    selectedAI,
    setSelectedAI,
    sendMessage,
    createNewChat,
    selectChat,
    deleteChat,
    clearAnonymousChat,
    isAnonymous: user?.isAnonymous || false,
  };
};
