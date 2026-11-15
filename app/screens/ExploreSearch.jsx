import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import ActivityImage from "../components/ActivityImage";
import { getCategoryTitle } from "../utils/explore";
import Icon from "@expo/vector-icons/MaterialIcons";
import { userState } from "../state/atoms/UserState";
import { matchState } from "../state/atoms/MatchState";
import { useAtomValue, useSetAtom } from "jotai";
import { createAuthenticatedSocket } from "../network/socket";

export default function ExploreSearch({ route }) {
  const [socket, setSocket] = useState(null);
  const setMatchResult = useSetAtom(matchState);
  const userData = useAtomValue(userState);
  const [noResult, setNoResult] = useState(false);
  const navigation = useNavigation();
  const { platform, item, itemTitle } = route.params ?? {};
  const query = `${itemTitle || ""}`.trim();

  useEffect(() => {
    if (!userData?._id || !query) {
      return;
    }

    const newSocket = createAuthenticatedSocket();
    setSocket(newSocket);
    const submitSearch = () => {
      setNoResult(false);
      newSocket.emit("submit_keyword", {
        userId: userData._id,
        query,
      });
    };

    newSocket.on("connect", () => {
      console.log("Client Connected to WebSocket server");
      submitSearch();
    });
    newSocket.on("search_update", (data) => {
      const match = data?.matches;

      if (match?.user?._id) {
        setMatchResult(match);
        navigation.navigate("Result", { platform });
      } else {
        setMatchResult(null);
        setNoResult(true);
      }
    });
    newSocket.on("error", (error) => {
      console.error("Error from server:", error.message);
      Alert.alert("Error", error.message || "Something went wrong");
    });

    return () => {
      newSocket.off("search_update");
      newSocket.off("error");
      newSocket.disconnect();
    };
  }, [navigation, query, setMatchResult, userData?._id]);

  const handleCancelSearch = () => {
    if (socket?.connected && userData?._id) {
      socket.emit("cancel_search", { userId: userData._id });
    }
    navigation.goBack();
  };
  const tryAgain = () => {
    if (!socket?.connected || !userData?._id) {
      Alert.alert("Connection unavailable", "Please try again in a moment");
      return;
    }

    setNoResult(false);
    socket.emit("submit_keyword", {
      userId: userData._id,
      query,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"} `}>
        <View className="flex-row items-center ">
          <Pressable onPress={handleCancelSearch}>
            <Icon name="arrow-back-ios-new" size={20} />
          </Pressable>
          <Text className="text-xl font-semibold ml-5">
            {getCategoryTitle(itemTitle)}
          </Text>
        </View>

        <View className="mt-32">
          <View style={styles.carouselItemContainer}>
            <ActivityImage item={item} testID="selected-activity-image" />
          </View>
          {!noResult ? (
            <Text className="my-5 text-center text-sm font-medium">
              Searching for a budy. . .
            </Text>
          ) : (
            <Text className="text-primary_red text-sm font-medium text-center my-5">
              No Users found,
              Try again or Try different.
            </Text>
          )}
          {noResult ? (
            <TouchableOpacity
              className="mt-5 rounded-3xl w-32 py-3 self-center bg-primary_blue"
              onPress={tryAgain}
            >
              <Text className="text-center text-sm text-white">Try again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="mt-5 rounded-3xl w-32 py-3 self-center bg-primary_red"
              onPress={handleCancelSearch}
            >
              <Text className="text-center text-sm text-white">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  carouselItemContainer: {
    backgroundColor: "white",
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
