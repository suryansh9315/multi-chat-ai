"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useAuth } from "./useAuth";
import {
  addMessage,
  createChat,
  updateChatTitle,
  subscribeToMessages,
  subscribeToUserChatsSimple,
  deleteChat as deleteChatFromDB,
} from "@/lib/firestore";
import { callOpenAI } from "@/lib/aiServices";
import {
  buildConversationTitle,
  buildSessionConfig,
  buildSessionTitle,
  defaultSessionConfig,
} from "@/constants/sessionPersonas";
import type {
  Message,
  Chat,
  AIProvider,
  ChatSessionConfig,
  OpenAIChatMessage,
} from "@/types";

interface SendMessageOptions {
  chatId?: string;
  sessionConfig?: ChatSessionConfig;
}

interface ChatContextType {
  messages: Message[];
  chats: Chat[];
  currentChatId: string | null;
  currentSessionConfig: ChatSessionConfig;
  isLoading: boolean;
  selectedAI: AIProvider;
  setSelectedAI: Dispatch<SetStateAction<AIProvider>>;
  sendMessage: (
    text: string,
    options?: SendMessageOptions,
  ) => Promise<string | null>;
  startNewSession: (sessionConfig?: ChatSessionConfig) => Promise<string | null>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  clearAnonymousChat: () => void;
  isAnonymous: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const mapMessagesToConversation = (
  history: Message[],
  userInput: string,
  sessionConfig: ChatSessionConfig,
): OpenAIChatMessage[] => {
  const historyMessages: OpenAIChatMessage[] = history.map((message) => ({
    role: message.sender === "ai" ? "assistant" : "user",
    content: message.text,
  }));

  return [
    {
      role: "system",
      content: sessionConfig.systemPrompt,
    },
    ...historyMessages,
    {
      role: "user",
      content: userInput,
    },
  ];
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAI, setSelectedAI] = useState<AIProvider>("chatgpt");
  const [anonymousMessages, setAnonymousMessages] = useState<Message[]>([]);
  const [anonymousSessionConfig, setAnonymousSessionConfig] =
    useState<ChatSessionConfig>(defaultSessionConfig);

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

  useEffect(() => {
    if (!currentChatId || !user || user.isAnonymous) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(currentChatId, (chatMessages) => {
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [currentChatId, user]);

  useEffect(() => {
    if (user?.isAnonymous) {
      setCurrentChatId(null);
    } else if (user) {
      setMessages([]);
    } else {
      setCurrentChatId(null);
      setMessages([]);
      setAnonymousMessages([]);
      setAnonymousSessionConfig(defaultSessionConfig);
    }
  }, [user]);

  const currentSessionConfig = useMemo(() => {
    if (user?.isAnonymous) {
      return anonymousSessionConfig;
    }

    const selectedChat = chats.find((chat) => chat.id === currentChatId);
    return selectedChat?.sessionConfig || defaultSessionConfig;
  }, [anonymousSessionConfig, chats, currentChatId, user?.isAnonymous]);

  const startNewSession = useCallback(
    async (sessionConfig = buildSessionConfig()) => {
      if (!user) {
        return null;
      }

      if (user.isAnonymous) {
        setAnonymousMessages([]);
        setCurrentChatId(null);
        setMessages([]);
        setAnonymousSessionConfig(sessionConfig);
        return "anonymous";
      }

      const chatId = await createChat(
        buildSessionTitle(sessionConfig),
        selectedAI,
        user.uid,
        sessionConfig,
      );

      setCurrentChatId(chatId);
      setMessages([]);
      return chatId;
    },
    [selectedAI, user],
  );

  const sendMessage = useCallback(
    async (text: string, options?: SendMessageOptions) => {
      if (!text.trim() || isLoading || !user) return null;

      const trimmedText = text.trim();
      const sessionConfig = options?.sessionConfig || currentSessionConfig;
      setIsLoading(true);

      try {
        if (user.isAnonymous) {
          const userMessage: Message = {
            id: `msg_${Date.now()}`,
            text: trimmedText,
            sender: "user",
            timestamp: new Date().toISOString(),
            ai: selectedAI,
            chatId: "anonymous",
            userId: user.uid,
          };

          const conversation = mapMessagesToConversation(
            anonymousMessages,
            trimmedText,
            sessionConfig,
          );

          setAnonymousMessages((prev) => [...prev, userMessage]);

          const aiResponse = await callOpenAI(conversation);

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
          return "anonymous";
        }

        let chatId = options?.chatId || currentChatId;

        if (!chatId) {
          chatId = await createChat(
            buildSessionTitle(sessionConfig),
            selectedAI,
            user.uid,
            sessionConfig,
          );
          setCurrentChatId(chatId);
          setMessages([]);
        }

        const history = chatId === currentChatId ? messages : [];
        const conversation = mapMessagesToConversation(
          history,
          trimmedText,
          sessionConfig,
        );

        if (history.length === 0) {
          await updateChatTitle(
            chatId,
            buildConversationTitle(sessionConfig, trimmedText),
          );
        }

        await addMessage(chatId, trimmedText, "user", selectedAI, user.uid);

        const aiResponse = await callOpenAI(conversation);
        const responseText = aiResponse.success
          ? aiResponse.text
          : `Sorry, I encountered an error: ${aiResponse.error}`;

        await addMessage(chatId, responseText, "ai", selectedAI, user.uid);

        return chatId;
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

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      anonymousMessages,
      currentChatId,
      currentSessionConfig,
      isLoading,
      messages,
      selectedAI,
      user,
    ],
  );

  const selectChat = useCallback(
    (chatId: string) => {
      if (!user || user.isAnonymous) {
        return;
      }

      setCurrentChatId(chatId);
    },
    [user],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      if (!user || user.isAnonymous) {
        return;
      }

      try {
        await deleteChatFromDB(chatId);

        if (currentChatId === chatId) {
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

  const value = useMemo(
    () => ({
      messages: user?.isAnonymous ? anonymousMessages : messages,
      chats: user?.isAnonymous ? [] : chats,
      currentChatId: user?.isAnonymous ? null : currentChatId,
      currentSessionConfig,
      isLoading,
      selectedAI,
      setSelectedAI,
      sendMessage,
      startNewSession,
      selectChat,
      deleteChat,
      clearAnonymousChat,
      isAnonymous: user?.isAnonymous || false,
    }),
    [
      anonymousMessages,
      chats,
      clearAnonymousChat,
      currentChatId,
      currentSessionConfig,
      deleteChat,
      isLoading,
      messages,
      selectChat,
      selectedAI,
      sendMessage,
      startNewSession,
      user?.isAnonymous,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
