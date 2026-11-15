import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import React from "react";
import { API_BASE_URL } from "../../constant";
const CarouselComp = ({ width, dataArr, onPress, itemMain }) => {
  return (
    <FlatList
      testID="activity-carousel"
      horizontal
      data={dataArr}
      style={{ width: "100%", height: width / 2.3 }}
      snapToInterval={width * 0.7}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => `${item.imgUrl}-${index}`}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.carouselItemContainer, { width: width * 0.7 - 15 }]}
          onPress={() => {
            onPress(item, itemMain);
          }}
        >
          <View style={styles.image}>
            <Image
              testID="activity-image"
              source={{ uri: `${API_BASE_URL}${item.imgUrl}` }}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
            <View style={styles.overlay}>
              <Text className="text-white font-semibold text-lg items-end pb-3 pl-3 capitalize">
                {item.text}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
};
const styles = StyleSheet.create({
  carouselItemContainer: {
    backgroundColor: "white",
    height: Platform.OS == "ios" ? 170 : 155,
    justifyContent: "center",
    borderRadius: 22,
    marginRight: 15,
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5, // Box shadow for Android
  },
  image: {
    height: "100%",
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent overlay
    borderRadius: 22,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
});

export default CarouselComp;
