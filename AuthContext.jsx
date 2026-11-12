// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { Auth } from "./FirebaseConfig";
import { useSetAtom } from "jotai";
import axios from "axios";
import { userState } from "./app/state/atoms/UserState";
import { API_BASE_URL } from "./constant";
import { profilePhotoApi } from "./app/profilePhoto/api";
import { setProfilePhotoAuthUser } from "./app/profilePhoto/currentAuth";

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
      setProfilePhotoAuthUser(user);
      setUser(user);
      if (user?.uid) {
        const getUserInfo = async () => {
          try {
            const token = await user.getIdToken();
            if (!API_BASE_URL) throw new Error("A secure ClickMate API URL is required.");
            const res = await axios.get(`${API_BASE_URL}/user/${encodeURIComponent(user.email)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (currentRequest === requestId) setUserMongoData(res.data);
            try {
              const avatar = await profilePhotoApi.getProfile();
              if (currentRequest === requestId) {
                setUserMongoData((current) => current?._id === res.data?._id ? { ...current, ...avatar } : current);
              }
            } catch {
              // The existing profile remains usable when avatar retrieval is unavailable.
            }
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
    return () => { requestId++; setProfilePhotoAuthUser(null); subscribe(); };
  }, []);

  return (
    <AuthContext.Provider value={{ user, platform }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
