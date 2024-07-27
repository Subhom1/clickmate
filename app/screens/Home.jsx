import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/FontAwesome5";
import Icon2 from "react-native-vector-icons/Feather";
import io from "socket.io-client";
import { userState } from "../state/atoms/UserState";
import { useRecoilState, useSetRecoilState } from "recoil";
import { matchState } from "../state/atoms/MatchState";
import { useNavigation } from "@react-navigation/native";

// Replace with your WebSocket server URL
const socket = io("http://172.17.16.85:5051");
export default function Home() {
  const [searchText, setSearchText] = useState("");
  // const [searchResults, setSearchResults] = useState([]);
  const [userId, setUserId] = useState(""); // Set your actual user ID here
  const [userData, setUserData] = useRecoilState(userState);
  const [searchLoading, setSearchLoading] = useState(false);
  const setMatchResult = useSetRecoilState(matchState)
  const navigation = useNavigation();

  useEffect(() => {
    if (userData?._id) setUserId(userData?._id);
  }, [userData]);

  useEffect(() => {
    // Setup WebSocket listeners
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("search_update", (data) => {
      console.log("Search update received:", data.matches);
      setSearchLoading(false)
      setMatchResult(data.matches || []);
      navigation.navigate('Result')
    });

    socket.on("error", (error) => {
      console.error("Error from server:", error.message);
      alert("Error", error.message);
    });

    // Clean up WebSocket connection on unmount
    return () => {
      socket.off("search_update");
      socket.off("error");
      socket.disconnect();
    };
  }, []);

  const handleSearch = () => {
    if (searchText.trim() === "") {
      alert("Please enter a search query");
      return;
    }
    setSearchLoading(true);
    // Emit search query to WebSocket server
    socket.emit("submit_keyword", { userId, query: searchText });
  };
  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      <View className="mx-10 mt-20">
        <Text className="text-left text-4xl font-bold text-primary_green">
          Search for Your
        </Text>
        <Text className="text-left text-4xl font-bold text-black">
          new journey <Icon name="location-arrow" size={25} color="#000" />
        </Text>
        <Text className="my-5 text-gray-500">
          New in town?{"\n"}
          Be it a Friendship or Relationship that you are looking for or Just
          wanna chat with someone globally.
        </Text>
        {/* {searchResults.map((item, index) => (
          <Text key={index}>{item.user.fullname}</Text>
        ))} */}
        <TextInput
          placeholder="Type your current mood"
          className="border rounded-3xl p-5 text-gray-500 border-primary_green_light mt-20 font-roboto"
          onChangeText={(txt) => setSearchText(txt)}
          autoCapitalize="none"
          value={searchText}
          multiline={true}
          maxLength={400}
        />
        <Text className="text-primary_red text-xs mt-3">
          <Icon2 name="info" />
          The more descriptive your query, the more accurate the result will be.
        </Text>
        <TouchableOpacity
          className={`${
            searchLoading ? "bg-primary_gray" : "bg-primary_green"
          } mt-5 rounded-3xl w-32 py-3 self-center`}
          onPress={handleSearch}
          disabled={searchLoading}
        >
          {searchLoading ? (
            <Text className="text-center text-sm text-white">
              Loading . . .
            </Text>
          ) : (
            <Text className="text-center text-sm text-white">Search</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
