import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Pressable, Platform
} from "react-native";
import React from "react";
import Carousel from "react-native-reanimated-carousel";
import { IP } from "../../constant";
const CarouselComp = ({ width, dataArr, onPress, itemMain, platform }) => {
  const baseOptions = {
    vertical: false,
    width: width * 0.7,
    height: width / 2.3,
  };
  return (
    <Carousel
      {...baseOptions}
      loop={false}
      style={{ width: "100%" }}
      data={dataArr}
      pagingEnabled={true}
      onSnapToItem={(index) => console.log("current index:", index)}
      renderItem={({ item, index }) => (
        <Pressable
          style={styles.carouselItemContainer}
          onPress={() => {
            onPress(item, itemMain);
          }}
        >
          {/* ImageBackground allows us to put an overlay and content over the image */}
          <ImageBackground
            source={{ uri: `http://${IP}:5051${item.imgUrl}` }}
            style={styles.image}
            imageStyle={styles.imageBorderRadius}
          >
            {/* Overlay */}
            <View style={styles.overlay}>
              <Text className="text-white font-semibold text-lg items-end pb-3 pl-3 capitalize">
                {item.text}
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
      )}
    />
  );
};
const styles = StyleSheet.create({
  carouselItemContainer: {
    height: Platform.OS =='ios'?170:155,
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
  },
  imageBorderRadius: {
    borderRadius: 22, // Border radius for the image
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
