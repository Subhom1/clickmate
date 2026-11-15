import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../constant";

// Keep the activity photo and its title together on Explore and search screens.
export default function ActivityImage({ item, testID }) {
  return (
    <View style={styles.container}>
      <Image
        testID={testID}
        source={{ uri: `${API_BASE_URL}${item.imgUrl}` }}
        style={styles.photo}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text className="text-white font-semibold text-lg items-end pb-3 pl-3 capitalize">
          {item.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
  },
  photo: {
    // iPhone needs explicit dimensions for an absolutely positioned remote image.
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
});
