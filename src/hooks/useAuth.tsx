import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, getDocFromServer } from "firebase/firestore";
import { User, Family } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

interface AuthContextType {
  user: User | null;
  family: Family | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          console.log("No user session found. Attempting automatic guest login...");
          // Enable anonymous login so the user never sees a login/password screen
          await signInAnonymously(auth);
          return; // onAuthStateChanged will trigger again with the new guest user
        }

        if (fbUser) {
          console.log("Auth Sync State: User is logged in", {
            uid: fbUser.uid,
            isAnonymous: fbUser.isAnonymous,
            providerId: fbUser.providerId,
            dbId: firebaseConfig.firestoreDatabaseId
          });
          
          const userPath = `users/${fbUser.uid}`;
          console.log("Auth Sync: Fetching user profile from path:", userPath);

          // Use getDocFromServer to bypass potential local cache permission issues
          let userDoc;
          try {
            userDoc = await getDocFromServer(doc(db, "users", fbUser.uid));
            console.log("Auth Sync: Fetch completed. Document exists:", userDoc.exists());
          } catch (fetchError: any) {
            console.error("Auth Sync: PERMISSION_DENIED on getDocFromServer at path", userPath, {
              code: fetchError.code,
              message: fetchError.message,
              stack: fetchError.stack
            });
            throw fetchError;
          }
          
          let userData: User;
          
          if (!userDoc.exists()) {
            console.log("Auth Sync: Creating new user profile for", fbUser.uid);
            userData = {
              uid: fbUser.uid,
              email: fbUser.email || (fbUser.isAnonymous ? `guest_${fbUser.uid.substring(0, 5)}@ezbah.app` : "user@ezbah.app"),
              displayName: fbUser.displayName || (fbUser.isAnonymous ? "Guest User" : "New User"),
            };
            try {
              await setDoc(doc(db, "users", fbUser.uid), userData);
              console.log("Auth Sync: Profile created successfully");
            } catch (createError: any) {
              console.error("Auth Sync: FAIL on setDoc for profile", createError.code, createError.message);
              throw createError;
            }
          } else {
            userData = { uid: userDoc.id, ...userDoc.data() } as User;
          }

        setUser(userData);

        // Fetch family context
        if (userData.familyId) {
          try {
            const famDoc = await getDoc(doc(db, "families", userData.familyId));
            if (famDoc.exists()) {
              setFamily({ id: famDoc.id, ...famDoc.data() } as Family);
              console.log("Family context loaded successfully");
            } else {
              console.warn("Family document not found for ID:", userData.familyId);
            }
          } catch (famError: any) {
            console.error("Family fetch permission error (Handled):", famError.code);
          }
        }
      }
    } catch (error: any) {
        console.error("Critical Auth Sync Error:", error.code, error.message);
        setUser(null);
        setFamily(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, family, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
