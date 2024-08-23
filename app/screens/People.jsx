import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  FlatList,
  Pressable,
} from "react-native";
import React from "react";
import { useRecoilState } from "recoil";
import { userState } from "../state/atoms/UserState";
import Icon from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";

export default function People({ route }) {
  const [userData, setUserData] = useRecoilState(userState);
  const navigation = useNavigation();

  const friends = userData?.friends || [];
  const { platform } = route.params;
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"}`}>
        <Text className="text-2xl font-bold mb-5">People</Text>
        {!friends?.length ? (
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
            data={friends}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View className="flex-row mt-2 justify-between bg-slate-200 px-5 py-3 rounded-2xl">
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
                >
                  <Icon name="message1" size={23} color="#0C4BA5" />
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
