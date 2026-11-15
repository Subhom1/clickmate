import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StatusBar,
  FlatList,
  Pressable,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { userState } from "../state/atoms/UserState";
import Icon from "@expo/vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import { createAuthenticatedSocket } from "../network/socket";
import { authenticatedHeaders } from "../network/auth";
import axios from "axios";
import { API_BASE_URL } from "../../constant";
import { InitialsCircle } from "../components/CreateAvatar";
import { useFreshFriends } from "../hooks/useFreshFriends";

export default function People({ route }) {
  const userData = useAtomValue(userState);
  const [userUnreadArr, setUserUnreadArr] = useState(null);
  const navigation = useNavigation();
  useFreshFriends(userData?._id);
  useEffect(() => {
    let active = true;
    setUserUnreadArr(null);
    const newSocket = createAuthenticatedSocket();
    const getUnreadMsgs = async () => {
      if (!userData?._id) return;
      try {
        const headers = await authenticatedHeaders();
        const res = await axios.get(`${API_BASE_URL}/unread-messages/${userData._id}`, { headers });
        if (active) setUserUnreadArr(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    // Listen for updates to unread counts
    newSocket.on("updateUnreadCounts", () => {
      getUnreadMsgs();
    });
    if (userData?._id) {
      getUnreadMsgs();
    }

    return () => {
      active = false;
      newSocket.off("updateUnreadCounts");
      newSocket.disconnect();
    };
  }, [userData?._id]);

  // Unread counts belong to this screen; keep the shared profile unchanged.
  const friendsWithUnreadCounts = useMemo(() => {
    if (!userUnreadArr) return userData?.friends ?? [];
    const counts = new Map(userUnreadArr.map(({ userId, count }) => [userId, count]));
    return (userData?.friends ?? []).map((friend) => ({
      ...friend,
      count: counts.get(friend._id) ?? 0,
    }));
  }, [userData?.friends, userUnreadArr]);

  const { platform } = route.params;
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"}`}>
        <Text className="text-2xl font-bold mb-5">People</Text>
        {!friendsWithUnreadCounts.length ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-primary_gray">
              Search to find people like you
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={{
              paddingBottom: platform == "ios" ? 80 : 100,
            }}
            data={friendsWithUnreadCounts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View className="flex-row mt-2 justify-between bg-slate-200 px-8 py-4 rounded-2xl">
                <Pressable
                  className="flex-row items-center"
                  onPress={() => {
                    navigation.navigate("VisitorProfile", {
                      userEmail: item.email,
                    });
                  }}
                >
                  <InitialsCircle name={item.fullname} photoUri={item.avatarUrl} avatarFileId={item.avatarFileId} styles={{ circle: { width: 40, height: 40, borderRadius: 20, marginRight: 12 }, initials: { fontSize: 14 } }} />
                  <Text className="text-secondary_blue_deep text-lg capitalize">
                    {item.fullname}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    navigation.navigate("ChatScreen", { secondUserInfo: item });
                  }}
                  className="relative"
                >
                  <Icon name="message" size={23} color="#0C4BA5" />
                  {item?.count > 0 && (
                    <View className="bg-primary_red w-5 h-5 rounded-full justify-center absolute bottom-4 left-4">
                      <Text className="text-white font-bold text-center text-xs">
                        {item?.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
