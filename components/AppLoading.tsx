import { useAuth } from "@/hooks/useAuth";
import { Sparkles } from "lucide-react";
import React from "react";

const AppLoading = () => {
  const { loading: authLoading } = useAuth();
  if (!authLoading) {
    return null;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background/90 w-full fixed left-0 top-0 z-50">
      <div className="text-center text-white">
        <div className="w-16 h-16 bg-linear-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Loading AI Chat Hub...</h2>
        <p className="text-gray-400">Initializing your chat experience</p>
      </div>
    </div>
  );
};

export default AppLoading;
