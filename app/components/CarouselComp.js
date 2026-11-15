import {
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import React from "react";
import ActivityImage from "./ActivityImage";
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
          <ActivityImage item={item} testID="activity-image" />
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
});

export default CarouselComp;
