import { View, Text, SafeAreaView, StatusBar } from "react-native";
import React from 'react'

export default function People() {
  return (
    <SafeAreaView>
      <StatusBar style="auto" />
      <View>
        <Text>People page</Text>
      </View>
    </SafeAreaView>
  );
}