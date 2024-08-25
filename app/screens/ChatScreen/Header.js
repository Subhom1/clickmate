import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const Header = ({ leftBtnAction, fullName, platform }) => {
  return (
    <View
      style={[styles.container, platform == "android" && { marginTop: 30 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={leftBtnAction}>
          <Icon name="arrow-back-ios-new" size={20} />
        </Pressable>
        <Text className="text-lg capitalize pl-24">{fullName}</Text>
        {/* <Text className="text-xs text-primary_green">Available</Text> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    justifyContent: "start",
    flexDirection: "row",
  },
});

export default Header;
