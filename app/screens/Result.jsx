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

export default function Result() {
  const [match, setMatchData] = useRecoilState(matchState);
  const clearMatchResult = useSetRecoilState(matchState);
  useEffect(() => {
    return () => {
      clearMatchResult(null);
    };
  });
  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      <View className="mx-10 mt-20">
        <Text className="text-center text-3xl font-bold text-primary_green">
          You have got a match
        </Text>
        <Text className="text-center text-3xl font-bold text-black">
          for your search
        </Text>
        <Text className="mt-20 text-gray-500 text-center">
          You can either request{"\n"}
          Voice or Chat, else find someone next.
        </Text>
        {match.map((item, index) => (
          <Text key={index} className="text-2xl text-center mt-12">
            {item.user.fullname}
          </Text>
        ))}
        <View className="flex-row justify-evenly mt-8">
          <TouchableOpacity className=" bg-primary_green rounded-3xl w-20 py-3 self-center">
            <Text className="text-white text-center">Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity className=" bg-primary_blue rounded-3xl w-20 py-3 self-center">
            <Text className="text-white text-center">Chat</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 mt-8 text-center">
          1 out of 10 searches left
        </Text>
        <View className="flex-row justify-evenly mt-8">
          <Pressable
            onPress={() => {
              console.log("Secondary Button Pressed");
            }}
          >
            <Text className="text-secondary_green_deep underline">
              Search Again
            </Text>
          </Pressable>
          <Pressable>
            <Text className="text-secondary_blue_deep underline">
              New Search
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
