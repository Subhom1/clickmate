import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StatusBar, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../constant";
import { useAtomValue } from "jotai";
import { userState } from "../state/atoms/UserState";
import { useNavigation } from "@react-navigation/native";
import Icon from "@expo/vector-icons/MaterialIcons";
import { InitialsCircle } from "../components/CreateAvatar";

export default function VisitorProfile({ route }) {
  const [visitorData, setVisitorData] = useState(null);
  const { userEmail, platform } = route.params;
  const navigation = useNavigation();
  const userData = useAtomValue(userState);
  const friend = userData?.friends?.find((item) => item.email === userEmail);

  useEffect(() => {
    let active = true;
    const interests = friend?.interests ?? [];
    setVisitorData(friend ? {
      ...friend,
      interests: interests.filter((item) => item?.text),
    } : null);

    if (friend && interests.some((item) => !item?.text) && API_BASE_URL) {
      axios.get(`${API_BASE_URL}/interests`).then((res) => {
        if (!active) return;
        const namesById = new Map(res.data.map((item) => [item._id, item]));
        setVisitorData({
          ...friend,
          interests: interests.map((item) =>
            item?.text ? item : namesById.get(typeof item === "string" ? item : item?._id)
          ).filter(Boolean),
        });
      }).catch(() => {
        // The profile remains available if interest names cannot be loaded.
      });
    }

    return () => { active = false; };
  }, [friend, userEmail]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`${platform == "ios" ? "mt-5" : "mt-16"} mx-7`}>
        <Pressable
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Icon name="arrow-back-ios-new" size={20} />
        </Pressable>
        <View className="mt-5">
          <InitialsCircle name={visitorData?.fullname || ""} photoUri={visitorData?.avatarUrl} avatarFileId={visitorData?.avatarFileId} styles={{ circle: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 }, initials: { fontSize: 22 } }} />
          <Text className="text-2xl font-medium capitalize">
            {visitorData?.fullname}
          </Text>
        </View>
        <View className="">
          <Text className="text-gray-600 mt-3 mb-7">{visitorData?.bio}</Text>
        </View>

        {!visitorData?.interests?.length ? (
          <></>
        ) : (
          <>
            <Text className="mb-3 font-medium">Interests</Text>
            <View className="flex-row flex-wrap">
              {visitorData?.interests.map((it, index) => (
                <View
                  key={it._id}
                  className="px-4 py-2 rounded-full mb-2 mr-1 bg-primary_green_light"
                >
                  <Text className="text-white">{it.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
