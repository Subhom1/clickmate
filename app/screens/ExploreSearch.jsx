import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { IP } from "../../constant";
import Icon from "react-native-vector-icons/MaterialIcons";
import { userState } from "../state/atoms/UserState";
import { matchState } from "../state/atoms/MatchState";
import { useRecoilState, useSetRecoilState } from "recoil";
import io from "socket.io-client";

export default function ExploreSearch({ route }) {
  const [socket, setSocket] = useState(null);
  const setMatchResult = useSetRecoilState(matchState);
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useRecoilState(userState);
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const navigation = useNavigation();
  const { platform, item, itemTitle } = route.params;

  useEffect(() => {
    if (userData?._id) setUserId(userData?._id);
  }, [userData]);
  useEffect(() => {
    // Initialize the socket connection when the component mounts
    const newSocket = io(`http://${IP}:5051`, { reconnectionAttempts: 5 });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Client Connected to WebSocket server");
    });
    setSearchLoading(true);
    setNoResult(false);
    newSocket.emit("submit_keyword", {
      userId: userData?._id,
      query: itemTitle,
    });
    newSocket.on("search_update", (data) => {
      setSearchLoading(false);
      setMatchResult(data.matches);
      if (data?.matches) {
        navigation.navigate("Result");
      } else if (data?.matches === null) {
        setNoResult(true);
        setTimeout(() => {
          setNoResult(false);
        }, 10000);
      }
    });
    newSocket.on("error", (error) => {
      console.error("Error from server:", error.message);
      alert("Error", error.message);
    });
    // Clean up WebSocket connection on unmount
    return () => {
      newSocket.off("search_update");
      newSocket.off("error");
    };
  }, []);

  const handleCancelSearch = () => {
    socket.emit("cancel_search", { userId });
    setSearchLoading(false);
    navigation.goBack();
  };
console.log(userId);
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"} `}>
        <View className="flex-row items-center ">
          <Pressable onPress={() => navigation.goBack()}>
            <Icon name="arrow-back-ios-new" size={20} />
          </Pressable>
          <Text className="text-xl font-semibold ml-5">
            {itemTitle == "hikes" && "Hikes to do together"}
            {itemTitle == "movies" && "Movies to watch together "}
          </Text>
        </View>

        <View className="mt-32">
          <View style={styles.carouselItemContainer}>
            <ImageBackground
              source={{ uri: `http://${IP}:5051${item.imgUrl}` }}
              style={styles.image}
              imageStyle={styles.imageBorderRadius}
            >
              <View style={styles.overlay}>
                <Text className="text-white font-semibold text-lg items-end pb-3 pl-3 capitalize">
                  {item?.text}
                </Text>
              </View>
            </ImageBackground>
          </View>
          {!noResult ? (
            <Text className="my-5 text-center text-lg font-medium">
              Searching for a budy. . .
            </Text>
          ) : (
            <Text className="text-primary_red font-bold  mt-5">
              No Users found,{"\n"}
              Try to be more specific about your search.
            </Text>
          )}
          <TouchableOpacity
            className="mt-5 rounded-3xl w-32 py-3 self-center bg-primary_red"
            onPress={handleCancelSearch}
          >
            <Text className="text-center text-sm text-white">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
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
  carouselItemContainer: {
    height: 170,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
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
