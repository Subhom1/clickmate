import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const Header = ({ leftBtnAction, fullName, platform }) => {
  return (
    <View
      style={[styles.container, platform == "android" && { marginTop: 30 }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={leftBtnAction}>
          <Icon name="arrow-back-ios-new" size={25} />
        </TouchableOpacity>
        <Text className="text-lg capitalize">{fullName}</Text>
        <Text className="text-xs text-primary_green">Available</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
});

export default Header;
