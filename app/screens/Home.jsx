import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/FontAwesome5";
import Icon2 from "react-native-vector-icons/Feather";
import io from "socket.io-client";
import { userState } from "../state/atoms/UserState";
import { useRecoilState, useSetRecoilState } from "recoil";
import { matchState } from "../state/atoms/MatchState";
import { useNavigation } from "@react-navigation/native";
import { IP } from "../../constant";

const socket = io(`http://${IP}:5051`, { reconnectionAttempts: 5 });
export default function Home({ route }) {
  const [searchText, setSearchText] = useState("");
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useRecoilState(userState);
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const setMatchResult = useSetRecoilState(matchState);
  const navigation = useNavigation();
  const { platform } = route.params;
  
  useEffect(() => {
    if (userData?._id) setUserId(userData?._id);
  }, [userData]);
  useEffect(() => {
    // Setup WebSocket listeners
    socket.on("connect", () => {
      console.log("Client Connected to WebSocket server");
    });
    socket.on("search_update", (data) => {
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
    setNoResult(false);
    socket.emit("submit_keyword", { userId, query: searchText });
  };
  const handleCancelSearch = () => {
    socket.emit("cancel_search", { userId });
    setSearchLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 mx-5">
      <StatusBar style="auto" />
      <View className=" mt-20">
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
        {noResult ? (
          <Text className="text-primary_red font-bold  mt-10">
            No Users found,{"\n"}
            Try to be more specific about your search.
          </Text>
        ) : (
          <Text className="h-9 mt-10"></Text>
        )}
        <TextInput
          placeholder="Type your current mood"
          className="border rounded-3xl p-5 text-gray-500 border-primary_green_light mt-5 font-roboto"
          onChangeText={(txt) => setSearchText(txt)}
          autoCapitalize="none"
          value={searchText}
          multiline={true}
          maxLength={400}
        />
        <Text className="text-primary_blue text-xs mt-3">
          <Icon2 name="info" style={{ margin: "10px" }} /> The more descriptive
          your query, the more accurate the result will be.
        </Text>
        <View className="flex-row justify-evenly">
          {/* {!searchLoading && ( */}
          <TouchableOpacity
            className={`${
              searchLoading ? "bg-primary_gray" : "bg-primary_green"
            } mt-5 rounded-3xl w-32 py-3 self-center`}
            onPress={handleSearch}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <Text className="text-center text-sm text-white">
                Searching . . .
              </Text>
            ) : (
              <Text className="text-center text-sm text-white">Search</Text>
            )}
          </TouchableOpacity>
          {/* )} */}
          {searchLoading && (
            <TouchableOpacity
              className={`mt-5 rounded-3xl w-32 py-3 self-center ${
                false ? "bg-primary_gray" : "bg-primary_red"
              }`}
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
