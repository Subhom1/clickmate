// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { Auth } from "./FirebaseConfig";
import { useSetAtom } from "jotai";
import axios from "axios";
import { userState } from "./app/state/atoms/UserState";
import { IP } from "./constant";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const platform = Platform.OS;
  const setUserMongoData = useSetAtom(userState);
  useEffect(() => {
    let requestId = 0;
    // Add listener for authentication state changes
    const subscribe = Auth.onAuthStateChanged((user) => {
      const currentRequest = ++requestId;
      setUser(user);
      if (user?.uid) {
        const getUserInfo = async () => {
          try {
            const res = await axios.get(`http://${IP}:5051/user/${user.email}`);
            if (currentRequest === requestId) setUserMongoData(res.data);
          } catch (e) {
            if (currentRequest === requestId) console.error(e, "Error message: mongodb user details");
          }
        };
        getUserInfo();
      } else {
        setUserMongoData(null);
      }
    });

    // Clean up listener on unmount
    return () => { requestId++; subscribe(); };
  }, []);

  return (
    <AuthContext.Provider value={{ user, platform }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
