// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { Platform } from "react-native";

import { Auth } from "./FirebaseConfig";
const AuthContext = createContext();


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    if (Platform.OS === "android") {
      setPlatform("android");
    } else if (Platform.OS === "ios") {
      setPlatform("ios");
    }
    // Add listener for authentication state changes
    const subscribe = Auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    // Clean up listener on unmount
    return () => subscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, platform }}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
