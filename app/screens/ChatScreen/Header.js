import React from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import Icon from "@expo/vector-icons/MaterialIcons";
import { InitialsCircle } from "../../components/CreateAvatar";

const Header = ({ leftBtnAction, rightBtnAction, onProfilePress, fullName, avatarUrl, avatarFileId, platform }) => {
  return (
    <View
      style={[styles.container, platform == "android" && { marginTop: 30 }]}
    >
      <View style={styles.header}>
        <Pressable onPress={leftBtnAction}>
          <Icon name="arrow-back-ios-new" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${fullName || "user"} profile`}
          disabled={!onProfilePress}
          onPress={onProfilePress}
          style={styles.profileButton}
        >
          <InitialsCircle
            name={fullName}
            photoUri={avatarUrl}
            avatarFileId={avatarFileId}
            styles={{ circle: styles.avatar, initials: styles.avatarInitials }}
          />
          <Text className="text-lg capitalize" numberOfLines={1}>{fullName}</Text>
        </Pressable>
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
  profileButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 8 },
  avatarInitials: { fontSize: 12, color: "#fff" },
});

export default Header;
