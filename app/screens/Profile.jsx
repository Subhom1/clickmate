import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Pressable,
} from "react-native";
import React, { useEffect } from "react";
import { Auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import axios from "axios";
import { useRecoilState } from "recoil";
import { userState } from "../state/atoms/UserState";
import { IP } from "../../constant";
import Icon from "react-native-vector-icons/Feather";

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
          `http://${IP}:5051/deleteUser/${userData._id}/${user.uid}`
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
    <SafeAreaView className="flex-1 mt-10 mx-7">
      <StatusBar style="auto" />
      <View className="flex-row mt-5 items-center justify-between">
        <Text className="text-2xl font-medium capitalize mt-10">
          {userData?.fullname}
        </Text>
        <View className="flex-row">
          <Pressable>
            <Icon name="edit" size={20} />
          </Pressable>
          <Pressable onPress={signOutt} className="ml-5">
            <Text className="text-primary_red">Logout</Text>
          </Pressable>
        </View>

        {/* <TouchableOpacity
          className="rounded-full w-40 items-center justify-center py-2 mt-5 bg-primary_red"
          onPress={deleteAcc}
        >
          <Text className="text-white">Delete Account</Text>
        </TouchableOpacity> */}
      </View>
      <View>
        <Text className="text-gray-600 my-5">{userData?.bio}</Text>
        <View className='flex-row flex-wrap'>

        {userData?.interests.map((it, index) => (
          <View key={it._id}  className="px-4 py-2 rounded-full mb-1 mr-1 bg-primary_green_light">
            <Text className='text-white'>{it.text}</Text>
          </View>
        ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
