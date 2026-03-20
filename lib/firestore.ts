import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Message, Chat, AIProvider } from "@/types";

export const messagesCollection = collection(db, "messages");
export const chatsCollection = collection(db, "chats");

export const addMessage = async (
  chatId: string,
  text: string,
  sender: "user" | "ai",
  aiProvider: AIProvider,
  userId?: string,
): Promise<string> => {
  try {
    const messageData = {
      chatId,
      text,
      sender,
      ai: aiProvider,
      userId: userId || "anonymous",
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(messagesCollection, messageData);
    // Update chat's last message and message count
    await updateChatLastMessage(chatId, text);
    return docRef.id;
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

export const createChat = async (
  title: string,
  aiProvider: AIProvider,
  userId?: string,
): Promise<string> => {
  try {
    const chatData = {
      title,
      userId: userId || "anonymous",
      aiProvider,
      messageCount: 0,
      isAnonymous: !userId || userId === "anonymous",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(chatsCollection, chatData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

export const updateChatLastMessage = async (
  chatId: string,
  lastMessage: string,
) => {
  const chatRef = doc(chatsCollection, chatId);
  await updateDoc(chatRef, {
    lastMessage,
    updatedAt: serverTimestamp(),
    messageCount: increment(1),
  });
  try {
  } catch (error) {
    console.error("Error updating chat:", error);
    throw error;
  }
};

export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
) => {
  const q = query(
    messagesCollection,
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc"),
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        sender: data.sender,
        ai: data.ai,
        timestamp:
          data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        chatId: data.chatId,
        userId: data.userId,
        createdAt: data.createdAt,
      };
    });
    callback(messages);
  });
};

export const subscribeToUserChats = (
  userId: string,
  callback: (chats: Chat[]) => void,
) => {
  if (!userId || userId === "anonymous") {
    callback([]);
    return () => {};
  }

  // Simplified query - only filter by userId first
  const q = query(
    chatsCollection,
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
    limit(50),
  );

  return onSnapshot(q, (snapshot) => {
    const allChats: Chat[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        userId: data.userId,
        aiProvider: data.aiProvider,
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage,
        isAnonymous: data.isAnonymous,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Filter out anonymous chats on the client side
    const authenticatedChats = allChats.filter((chat) => !chat.isAnonymous);
    callback(authenticatedChats);
  });
};

// Alternative: Get user's chats with even simpler query
export const subscribeToUserChatsSimple = (
  userId: string,
  callback: (chats: Chat[]) => void,
) => {
  if (!userId || userId === "anonymous") {
    callback([]);
    return () => {};
  }

  // Even simpler query - just userId and ordering
  const q = query(chatsCollection, where("userId", "==", userId), limit(50));

  return onSnapshot(q, (snapshot) => {
    const allChats: Chat[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        userId: data.userId,
        aiProvider: data.aiProvider,
        messageCount: data.messageCount || 0,
        lastMessage: data.lastMessage,
        isAnonymous: data.isAnonymous,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Filter and sort on the client side
    const authenticatedChats = allChats
      .filter((chat) => !chat.isAnonymous)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

    callback(authenticatedChats);
  });
};

export const deleteChat = async (chatId: string) => {
  try {
    // Delete all messages in the chat
    const messagesQuery = query(
      messagesCollection,
      where("chatId", "==", chatId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);

    const deletePromises = messagesSnapshot.docs.map((messageDoc) =>
      deleteDoc(messageDoc.ref)
    );

    await Promise.all(deletePromises);

    // Delete the chat document
    await deleteDoc(doc(chatsCollection, chatId));
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

export const transferAnonymousChats = async (
  oldUserId: string,
  newUserId: string
) => {
  try {
    // Simple query to get anonymous chats for the old user
    const anonymousChatsQuery = query(
      chatsCollection,
      where("userId", "==", oldUserId)
    );

    const chatsSnapshot = await getDocs(anonymousChatsQuery);

    const updatePromises = chatsSnapshot.docs.map(async (chatDoc) => {
      const chatData = chatDoc.data();

      // Only transfer if it's actually an anonymous chat
      if (chatData.isAnonymous) {
        const chatRef = doc(chatsCollection, chatDoc.id);
        await updateDoc(chatRef, {
          userId: newUserId,
          isAnonymous: false,
          updatedAt: serverTimestamp(),
        });

        // Update messages for this chat
        const messagesQuery = query(
          messagesCollection,
          where("chatId", "==", chatDoc.id),
          where("userId", "==", oldUserId)
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        const messageUpdatePromises = messagesSnapshot.docs.map(
          (messageDoc) => {
            const messageRef = doc(messagesCollection, messageDoc.id);
            return updateDoc(messageRef, {
              userId: newUserId,
            });
          }
        );

        await Promise.all(messageUpdatePromises);
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error transferring anonymous chats:", error);
  }
};
