import React from "react";
import { View } from "react-native";

// Reserve the tab for My Space until its content is ready.
export default function MySpace() {
  return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} testID="my-space-screen" />;
}
