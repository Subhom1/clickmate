import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const Header = ({ leftBtnAction, rightBtnAction, fullName, platform }) => {
  return (
    <View
      style={[styles.container, platform == "android" && { marginTop: 30 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={leftBtnAction}>
          <Icon name="arrow-back-ios-new" size={20} />
        </Pressable>
        <Text className="text-lg capitalize ">{fullName}</Text>
        <Pressable onPress={rightBtnAction}>
          <Icon name="delete" size={24} color="#AB0F12" />
        </Pressable>
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
    justifyContent: "space-between",
    flexDirection: "row",
  },
});

export default Header;
