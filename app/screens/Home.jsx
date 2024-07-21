import React from "react";
import {View, SafeAreaView, Text, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
export default function Home() {
  return (
    <SafeAreaView>
      <StatusBar style="auto" />
      <View>
        <Text>Home page</Text>
      </View>
    </SafeAreaView>
  );
}
