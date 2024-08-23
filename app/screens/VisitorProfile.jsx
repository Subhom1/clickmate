import { View, Text, SafeAreaView, StatusBar, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { IP } from "../../constant";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function VisitorProfile({ route }) {
  const [visitorData, setVisitorData] = useState(null);
  const { userEmail, platform } = route.params;
  const navigation = useNavigation();

  useEffect(() => {
    if (userEmail) {
      axios
        .get(`http://${IP}:5051/user/${userEmail}`)
        .then((res) => {
          setVisitorData(res.data);
        })
        .catch((e) => console.error(e, "Error message: mongodb user details"));
    }
  }, [userEmail]);

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
