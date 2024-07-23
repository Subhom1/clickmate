import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import React, { useEffect } from "react";
import { Auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import axios from "axios";
import { useRecoilState } from "recoil";
import { userState } from "../state/atoms/UserState";

export default function Profile() {
  const [userData, setUserData] = useRecoilState(userState);
  const signOutt = () => {
    signOut(Auth)
      .then(() => {
        console.log("Sign out sucessful");
        setUserData(null);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const deleteAcc = async () => {
    const user = Auth.currentUser;
    if (user) {
      try {
        // Backend to delete the user from Firebase Auth and MongoDB
        await axios.delete(
          `http://172.17.16.85:5051/deleteUser/${userData._id}/${user.uid}`
        );
        // Delete the user from Firebase Auth
        await user.delete();
        setUserData(null);
      } catch (error) {
        console.error("Error deleting user account:", error);
      }
    }
  };
  return (
    <SafeAreaView>
      <StatusBar style="auto" />
      <View className="flex mt-5 items-center justify-center">
        <TouchableOpacity
          className="rounded-full w-20 items-center justify-center py-2 mt-5 bg-secondary_blue_deep"
          onPress={signOutt}
        >
          <Text className="text-white">Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full w-40 items-center justify-center py-2 mt-5 bg-primary_red"
          onPress={deleteAcc}
        >
          <Text className="text-white">Delete Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
