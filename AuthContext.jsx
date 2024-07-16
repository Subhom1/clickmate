// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { Auth } from "./FirebaseConfig";
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Add listener for authentication state changes
    const subscribe = Auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    // Clean up listener on unmount
    return () => subscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
