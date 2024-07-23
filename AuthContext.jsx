// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { Auth } from "./FirebaseConfig";
import { useSetRecoilState } from "recoil";
import axios from "axios";
import { userState } from "./app/state/atoms/UserState";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [platform, setPlatform] = useState("");
  const setUserMongoData = useSetRecoilState(userState);
  useEffect(() => {
    if (Platform.OS === "android") {
      setPlatform("android");
    } else if (Platform.OS === "ios") {
      setPlatform("ios");
    }
    // Add listener for authentication state changes
    const subscribe = Auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        axios
          .get(`http://172.17.16.85:5051/user/${user?.email}`)
          .then((res) => {
            setUserMongoData(res.data.data);
          })
          .catch((e) =>
            console.log(e.message, "Error message mongodb user details")
          );
      }
    });

    // Clean up listener on unmount
    return () => subscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, platform }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
