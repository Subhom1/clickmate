import React from "react";
import { View, SafeAreaView, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
export default function Home() {
  const signOutt = () => {
    signOut(Auth)
      .then(() => {
        console.log('Sign out sucessful')
      })
      .catch((error) => {
        console.error(error);
      });
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
      </View>
    </SafeAreaView>
  );
}
