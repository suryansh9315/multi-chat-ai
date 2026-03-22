"use client";

import ChatInterface from "./ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import AppLoading from "./AppLoading";

const HomePageContent = () => {
  const { loading: authLoading, user } = useAuth();
  const {
    messages,
    isAnonymous,
    isLoading,
    sendMessage,
    selectedAI,
    setSelectedAI,
    currentChatId,
    startNewSession,
    currentSessionConfig,
  } = useChat();

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      {authLoading && <AppLoading />}
      <ChatInterface
        messages={messages}
        isAnonymous={isAnonymous}
        isLoading={isLoading}
        sendMessage={sendMessage}
        selectedAI={selectedAI}
        setSelectedAI={setSelectedAI}
        currentChatId={currentChatId}
        currentSessionConfig={currentSessionConfig}
        startNewSession={startNewSession}
        user={user}
        routerPush={(url: string) => window.location.assign(url)}
      />
    </div>
  );
};

export default HomePageContent;
