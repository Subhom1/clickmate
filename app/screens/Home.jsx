import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function Home() {
  const [searchText, setSearchText] = useState("");
  return (
    <SafeAreaView className='flex-1'>
      <StatusBar style="auto" />
      <View className="mx-10 mt-20">
        <Text className="text-left text-4xl font-bold text-primary_green">
          Search for Your
        </Text>
        <Text className="text-left text-4xl font-bold text-black">
          new journey <Icon name="location-arrow" size={25} color="#000" />
        </Text>
        <Text className="my-5 text-gray-500">
          New in town Be it a Friendship or Relationship that you are looking
          for or Just wanna chat with someone globally.
        </Text>
        <TextInput
          placeholder="Type your current mood"
          className="border rounded-3xl p-5 text-gray-500 border-primary_green_light mt-20 font-roboto"
          onChangeText={(txt) => setSearchText(txt)}
          autoCapitalize="none"
          value={searchText}
          multiline={true}
        />
        <TouchableOpacity className="bg-primary_green mt-5 rounded-3xl w-32 py-3 self-center">
          <Text className="text-center text-sm text-white">Search</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
