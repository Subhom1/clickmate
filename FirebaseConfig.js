import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseSecret } from "./FirebaseSecret";

export const FIREBASE_APP = initializeApp(firebaseSecret);

// Web uses Firebase's browser persistence; native uses AsyncStorage.
export const Auth = Platform.OS === "web"
  ? getAuth(FIREBASE_APP)
  : initializeAuth(FIREBASE_APP, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
