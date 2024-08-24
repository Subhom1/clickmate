import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState } from "react";

const ToggleSwitch = () => {
  const [isOn, setIsOn] = useState(true);
  const toggleSwitch = () => {
    setIsOn((isOn) => !isOn);
  };
  return (
    <View style={styles.container}>
      <Text
        style={isOn ? { color: "#67AB0F" } : { color: "#0C4BA5" }}
        className="mr-2 font-bold"
      >
        {isOn ? "Global" : "Local"}
      </Text>
      <TouchableOpacity
        style={[
          styles.outter,
          isOn
            ? { justifyContent: "flex-end", backgroundColor: "#67AB0F" }
            : { justifyContent: "flex-start", backgroundColor: "#0C4BA5" },
        ]}
        activeOpacity={1}
        onPress={toggleSwitch}
      >
        <View style={styles.inner} />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  inner: {
    width: 18,
    height: 18,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  outter: {
    width: 40,
    height: 23,
    backgroundColor: "#A7B0AD",
    borderRadius: 15,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 2,
  },
  container: {
    flexDirection: "row",
    justifyContent: "start",
    alignItems: "center",
  },
});
export default ToggleSwitch;
