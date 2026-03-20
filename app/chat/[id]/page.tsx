"use client";

import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const SingleChatPage = () => {
  const {
    messages,
    selectChat,
    currentChatId,
    isAnonymous,
    isLoading,
    sendMessage,
    selectedAI,
    setSelectedAI,
    createNewChat,
    chats,
  } = useChat();
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id;

  useEffect(() => {
    if (chatId && typeof chatId === "string" && chatId !== currentChatId) {
      selectChat(chatId);
    }
  }, [chatId, selectChat, currentChatId]);
  //   Redirect to chat if the current chat is deleted
  useEffect(() => {
    if (currentChatId && chats.length > 0) {
      const chatExists = chats.some((chat) => chat.id === currentChatId);
      if (!chatExists) {
        router.push("/");
      }
    }
  }, [chats, currentChatId, router]);

  return (
    <div className="flex-1">
      <ChatInterface
        messages={messages}
        isAnonymous={isAnonymous}
        isLoading={isLoading}
        sendMessage={sendMessage}
        selectedAI={selectedAI}
        setSelectedAI={setSelectedAI}
        user={user}
        currentChatId={currentChatId}
        createNewChat={createNewChat}
        routerPush={router.push}
      />
    </div>
  );
};

export default SingleChatPage;
