import { View, Text, SafeAreaView, StatusBar } from "react-native";
import React from 'react'

export default function People() {
  return (
    <SafeAreaView className='flex-1 mx-7'>
      <StatusBar style="auto" />
      <View>
        <Text>People page</Text>
      </View>
    </SafeAreaView>
  );
}