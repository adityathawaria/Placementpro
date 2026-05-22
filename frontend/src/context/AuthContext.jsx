// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthChange, signInWithGoogle, logOut, getUserProfile, saveUserProfile } from "../services/firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          let p = await getUserProfile(firebaseUser.uid);
          if (!p) {
            // Auto-create profile on first login
            p = {
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              photoURL: firebaseUser.photoURL || "",
              college: "",
              domain: "",
              resumeText: "",
              resumeSkills: {},
              createdAt: new Date().toISOString(),
            };
            await saveUserProfile(firebaseUser.uid, p);
          }
          setProfile(p);
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    await logOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data) => {
    if (!user) return;
    const updated = { ...profile, ...data };
    await saveUserProfile(user.uid, data);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
