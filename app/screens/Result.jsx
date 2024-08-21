import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useRecoilState, useSetRecoilState } from "recoil";
import { matchState } from "../state/atoms/MatchState";
import { useNavigation } from "@react-navigation/native";
import io from "socket.io-client";
import axios from "axios";
import { userState } from "../state/atoms/UserState";
import { chatState } from "../state/atoms/ChatState";
import { IP } from "../../constant";

// const socket = io(`http://${IP}:5051`);

export default function Result() {
  const [matchUser, setMatchUserData] = useRecoilState(matchState);
  const [userData, setUserData] = useRecoilState(userState);
  const setChatId = useSetRecoilState(chatState);
  const navigation = useNavigation();
  const createChat = async () => {
    await axios
      .post(`http://${IP}:5051/create-chat`, {
        user1Id: userData?._id,
        user2Id: matchUser?.user?._id,
      })
      .then((res) => {
        setChatId(res?.data?._id);
        navigation.navigate("ChatScreen");
      })
      .catch((e) => console.error(e, "Error creating chat"));
  };
  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      <View className="mx-10 mt-20">
        <Text className="text-center text-3xl font-bold text-primary_green">
          You have got a match
        </Text>
        <Text className="text-center text-3xl font-bold text-black">
          for your search 🌟
        </Text>
        <Text className="mt-20 text-gray-500 text-center">
          You can either request{"\n"}
          Voice or Chat, else find someone next.
        </Text>
        {matchUser && (
          <Text className="text-2xl text-center mt-12 capitalize">
            {matchUser?.user?.fullname}
          </Text>
        )}
        <View className="flex-row justify-evenly mt-8">
          {/* <TouchableOpacity className=" bg-primary_green rounded-3xl py-3 w-28 self-center">
            <Text className="text-white text-center">Add Friend</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            className=" bg-primary_blue rounded-3xl w-40 py-3 self-center"
            onPress={() => createChat()}
          >
            <Text className="text-white text-center">Connect and Chat</Text>
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
              Search Again
            </Text>
          </Pressable> */}
          <Pressable onPress={() => navigation.navigate("Tab")}>
            <Text className="text-secondary_blue_deep underline">
              New Search
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
