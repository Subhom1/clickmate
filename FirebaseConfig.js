// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// import { getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPMWLeIOPxGOMd_uvqhqj6UTgfwynqOfA",
  authDomain: "clickmate-57ede.firebaseapp.com",
  projectId: "clickmate-57ede",
  storageBucket: "clickmate-57ede.appspot.com",
  messagingSenderId: "376970328335",
  appId: "1:376970328335:web:93ebd4e709383effada67a",
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
// export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const Auth = initializeAuth(FIREBASE_APP, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
