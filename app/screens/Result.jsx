import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { useAtomValue, useSetAtom } from "jotai";
import { matchState } from "../state/atoms/MatchState";
import { useNavigation } from "expo-router/react-navigation";
import axios from "axios";
import { userState } from "../state/atoms/UserState";
import { chatState } from "../state/atoms/ChatState";
import { IP } from "../../constant";

export default function Result({ route }) {
  const matchUser = useAtomValue(matchState);
  const userData = useAtomValue(userState);
  const setChatId = useSetAtom(chatState);
  const navigation = useNavigation();
  const matchedUser = matchUser?.user;
  const platform = route?.params?.platform;

  const createChat = async () => {
    if (!userData?._id || !matchedUser?._id) {
      Alert.alert("Match unavailable", "Please start a new search");
      return;
    }

    await axios
      .post(`http://${IP}:5051/create-chat`, {
        user1Id: userData._id,
        user2Id: matchedUser._id,
      })
      .then((res) => {
        setChatId(res?.data?._id);
        navigation.navigate("ChatScreen", { platform });
      })
      .catch((e) => console.error(e, "Error creating chat"));
  };
  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      <View className=" mt-20">
        <Text className="text-center text-3xl font-bold text-primary_green">
          You have got a match
        </Text>
        <Text className="text-center text-3xl font-bold text-black">
          for your search 🌟
        </Text>
        <Text className="mt-20 text-gray-500 text-center">
          You can now Chat with the user,{"\n"} or find someone next.
        </Text>
        {matchedUser && (
          <Text className="text-2xl text-center mt-12 capitalize text-secondary_blue_deep">
            {matchedUser.fullname}
          </Text>
        )}
        <View className="flex-row justify-evenly mt-8">
          {/* <TouchableOpacity className=" bg-primary_green rounded-3xl py-3 w-28 self-center">
            <Text className="text-white text-center">Add Friend</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            className=" bg-primary_blue rounded-3xl w-24 py-3 self-center"
            onPress={() => createChat()}
          >
            <Text className="text-white text-center">Chat</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 mt-8 text-center">
          1 out of 10 searches left
        </Text>
        <View className="flex-row justify-evenly mt-8">
          {/* <Pressable
            onPress={() => {
              navigation.navigate("Tab");
              // handleSearch();
            }}
          >
            <Text className="text-secondary_green_deep underline">
              Home
            </Text>
          </Pressable> */}
          <Pressable
            onPress={() => navigation.navigate("Tab", { params: { platform } })}
          >
            <Text className="text-secondary_blue_deep underline">
              New Search
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
