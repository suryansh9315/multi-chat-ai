"use client";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  FC,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { transferAnonymousChats } from "@/lib/firestore";
import type { User, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used withing an AuthProvider");
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  //   Initialize auth state listener
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || undefined,
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
            isAnonymous: firebaseUser.isAnonymous,
            emailVerified: firebaseUser.emailVerified,
          };
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
        if (!initialized) {
          setInitialized(true);
        }
      },
      () => {
        isMounted = false;
        unsubscribe();
      },
    );
  }, [initialized]);
  // Auto sign-in anonymously if no user after initialization
  useEffect(() => {
    if (initialized && !user && !loading) {
      console.log("🔄 No user found, signing in anonymously...");
      signInAnonymous();
    }
  }, [initialized, user, loading]);

  //   signInWithEmail
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const previousUserId = user?.uid;
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Transfer anonymous chats if user was previously anonymous
      if (previousUserId && user?.isAnonymous && result.user) {
        console.log("🔄 Transferring anonymous chats...");
        await transferAnonymousChats(previousUserId, result.user.uid);
      }
    } catch (error) {
      console.error("❌ Email sign-in error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to sign in");
      } else {
        throw new Error("Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  };
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const previousUserId = user?.uid;

      console.log("📝 Signing up with email:", email);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Update display name to use part of email
      const displayName = email.split("@")[0];
      await updateProfile(result.user, { displayName });

      // Transfer anonymous chats if user was previously anonymous
      if (previousUserId && user?.isAnonymous && result.user) {
        console.log("🔄 Transferring anonymous chats...");
        await transferAnonymousChats(previousUserId, result.user.uid);
      }

      console.log("✅ Email sign-up successful");
    } catch (error) {
      console.error("❌ Email sign-up error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to create account");
      } else {
        throw new Error("Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const previousUserId = user?.uid;

      console.log("🔍 Signing in with Google...");
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");

      const result = await signInWithPopup(auth, provider);

      // Transfer anonymous chats if user was previously anonymous
      if (previousUserId && user?.isAnonymous && result.user) {
        console.log("🔄 Transferring anonymous chats...");
        await transferAnonymousChats(previousUserId, result.user.uid);
      }

      console.log("✅ Google sign-in successful");
    } catch (error) {
      console.error("❌ Google sign-in error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to sign in with Google");
      } else {
        throw new Error("Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymous = async () => {
    try {
      setLoading(true);

      await signInAnonymously(auth);
    } catch (error) {
      console.error("❌ Anonymous sign-in error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to sign in anonymously");
      } else {
        throw new Error("Failed to sign in anonymously");
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);

      // Automatically sign in anonymously after sign out
      setTimeout(() => {
        signInAnonymous();
      }, 100);
    } catch (error) {
      console.error("❌ Sign out error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to sign out");
      } else {
        throw new Error("Failed to sign out");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("🔑 Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("✅ Password reset email sent");
    } catch (error) {
      console.error("❌ Password reset error:", error);
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to send password reset email");
      } else {
        throw new Error("Failed to send password reset email");
      }
    }
  };
  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAnonymously: signInAnonymous,
    signOut,
    resetPassword,
  };
};

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
