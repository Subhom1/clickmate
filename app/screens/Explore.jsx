import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StatusBar,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { exploreState } from "../state/atoms/ExploreState";
import axios from "axios";
import { IP } from "../../constant";
import CarouselComp from "../components/CarouselComp";
import { useNavigation } from "expo-router/react-navigation";

export default function Explore({ route }) {
  const [explores] = useAtom(exploreState);
  const setExploreState = useSetAtom(exploreState);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const navigation = useNavigation();

  const getExplores = async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const res = await axios.get(`http://${IP}:5051/explore`);
      setExploreState(res.data);
    } catch (e) {
      console.error(e, "Error loading explore activities");
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getExplores();
  }, []);
  const platform = route.params?.platform;
  const width = Dimensions.get("window").width;
  const onPressTiles = (item, itemMain) => {
    navigation.navigate("ExploreSearch", {
      item,
      itemTitle: itemMain.category,
      platform,
    });
  };
  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 25 }}>
      <Text className="font-bold text-lg mt-5 mb-3 capitalize">
        {item.category == "hikes" && "Hikes to do together"}
        {item.category == "movies" && "Movies to watch together "}
      </Text>
      <CarouselComp
        dataArr={item?.list}
        width={width}
        onPress={onPressTiles}
        itemMain={item}
      />
    </View>
  );
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 ml-7 ${platform == "ios" ? "mt-5" : "mt-16"} `}>
        <Text className="text-2xl font-bold mb-5">Explore</Text>
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#67AB0F" />
            <Text className="text-primary_gray mt-3">
              Loading activities...
            </Text>
          </View>
        ) : hasError ? (
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-primary_gray text-center mb-4">
              We couldn&apos;t load activities right now.
            </Text>
            <Pressable
              onPress={getExplores}
              className="bg-primary_green rounded-3xl px-6 py-3"
            >
              <Text className="text-white font-medium">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={explores}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
