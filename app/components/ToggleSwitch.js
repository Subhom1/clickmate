import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState } from "react";
import colors from "../theme/colors";

const ToggleSwitch = () => {
  const [isOn, setIsOn] = useState(true);
  const toggleSwitch = () => {
    // Keep Global selected until local search is supported.
  };
  return (
    <View style={styles.container}>
      <Text
        style={isOn ? { color: colors.primary_green } : { color: colors.secondary_blue_deep }}
        className="mr-2 font-bold"
      >
        {isOn ? "Global" : "Local"}
      </Text>
      <TouchableOpacity
        style={[
          styles.outter,
          isOn
            ? { justifyContent: "flex-end", backgroundColor: colors.primary_green }
            : { justifyContent: "flex-start", backgroundColor: colors.secondary_blue_deep },
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
    backgroundColor: colors.primary_gray,
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
