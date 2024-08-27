import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  Pressable,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { userState } from "../state/atoms/UserState";
import Icon from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import io from "socket.io-client";
import axios from "axios";
import { IP } from "../../constant";

export default function People({ route }) {
  const [userData, setUserData] = useRecoilState(userState);
  const [userUnreadArr, setUserUnreadArr] = useState([]);
  const navigation = useNavigation();
  useEffect(() => {
    const newSocket = io(`http://${IP}:5051`, { reconnectionAttempts: 5 });
    const getUnreadMsgs = async () => {
      await axios
        .get(`http://${IP}:5051/unread-messages/${userData?._id}`)
        .then((res) => {
          setUserUnreadArr(res.data);
        })
        .catch((e) => console.error(e));
    };
    // Listen for updates to unread counts
    newSocket.on("updateUnreadCounts", () => {
      getUnreadMsgs();
    });
    if (userData?._id) {
      getUnreadMsgs();
    }

    return () => {
      newSocket.off("updateUnreadCounts");
      newSocket.disconnect();
    };
  }, [userData?._id]);

  useEffect(() => {
    if (userUnreadArr?.length && userData?.friends?.length) {
      const newFriends = userData?.friends.map((item) => {
        const unread = userUnreadArr.find(
          (unreadItem) => unreadItem.userId === item._id
        );
        return { ...item, count: unread ? unread.count : 0 };
      });
      setUserData((prev) => ({ ...prev, friends: newFriends }));
    }
  }, [userUnreadArr]);
  const { platform } = route.params;
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"}`}>
        <Text className="text-2xl font-bold mb-5">People</Text>
        {!userData?.friends?.length ? (
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
            data={userData?.friends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View className="flex-row mt-2 justify-between bg-slate-200 px-8 py-4 rounded-2xl">
                <Pressable
                  onPress={() => {
                    navigation.navigate("VisitorProfile", {
                      userEmail: item.email,
                    });
                  }}
                >
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
                  <Icon name="message1" size={23} color="#0C4BA5" />
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
