import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StatusBar, Pressable, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../constant";
import { useAtomValue } from "jotai";
import { userState } from "../state/atoms/UserState";
import { useNavigation } from "@react-navigation/native";
import Icon from "@expo/vector-icons/MaterialIcons";
import { InitialsCircle } from "../components/CreateAvatar";
import { useFreshFriends } from "../hooks/useFreshFriends";

export default function VisitorProfile({ route }) {
  const [interestNamesById, setInterestNamesById] = useState(new Map());
  const { userId, userEmail, platform } = route.params;
  const navigation = useNavigation();
  const userData = useAtomValue(userState);
  const { refreshing, refreshError } = useFreshFriends(userData?._id, userId ?? userEmail);
  const friend = userData?.friends?.find((item) =>
    userId ? item._id === userId : item.email === userEmail);
  const interests = friend?.interests ?? [];
  const visitorData = friend ? {
    ...friend,
    interests: interests.map((interest) => interest?.text
      ? interest
      : interestNamesById.get(typeof interest === "string" ? interest : interest?._id)).filter(Boolean),
  } : null;

  useEffect(() => {
    if (!interests.some((interest) => !interest?.text) || !API_BASE_URL) return;
    let active = true;
    axios.get(`${API_BASE_URL}/interests`).then((res) => {
      if (active) setInterestNamesById(new Map(res.data.map((interest) => [interest._id, interest])));
    }).catch(() => {
      // The profile remains available if interest names cannot be loaded.
    });

    return () => { active = false; };
  }, [friend?.interests]);

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
        {refreshing ? <ActivityIndicator accessibilityLabel="Refreshing profile" /> : null}
        {!refreshing ? (
          <>
            {refreshError ? <Text accessibilityRole="alert">Could not refresh this profile. Showing saved details.</Text> : null}
            {visitorData ? <><View className="mt-5">
              <InitialsCircle name={visitorData?.fullname || ""} photoUri={visitorData?.avatarUrl} avatarFileId={visitorData?.avatarFileId} styles={{ circle: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 }, initials: { fontSize: 22 } }} />
              <Text className="text-2xl font-medium capitalize">{visitorData?.fullname}</Text>
            </View>
            <Text className="text-gray-600 mt-3 mb-7">{visitorData?.bio}</Text>

            {visitorData?.interests?.length ? (
              <>
                <Text className="mb-3 font-medium">Interests</Text>
                <View className="flex-row flex-wrap">
                  {visitorData.interests.map((interest) => (
                    <View key={interest._id} className="px-4 py-2 rounded-full mb-2 mr-1 bg-primary_green_light">
                      <Text className="text-white">{interest.text}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}</> : <Text className="mt-5">Profile unavailable.</Text>}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
