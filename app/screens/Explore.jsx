import { View, Text, SafeAreaView, StatusBar } from "react-native";
import React from "react";

export default function Explore({ route }) {
  const { platform } = route.params;
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"}`}>
        <Text className="text-2xl font-bold mb-5">Explore</Text>

        <View className="flex-1 justify-center items-center">
          <Text className="text-primary_gray">
            Explore places and Do more together!{"\n"}(Coming soon)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
