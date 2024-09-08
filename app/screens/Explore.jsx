import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Dimensions,
  FlatList,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { exploreState } from "../state/atoms/ExploreState";
import axios from "axios";
import { IP } from "../../constant";
import CarouselComp from "../components/CarouselComp";
export default function Explore({ route }) {
  const [explores, setExplores] = useRecoilState(exploreState);
  const setExploreState = useSetRecoilState(exploreState);
  useEffect(() => {
    const getExplores = async () => {
      await axios
        .get(`http://${IP}:5051/explore`)
        .then((res) => setExploreState(res.data))
        .catch((e) => console.error(e));
    };
    getExplores();
  }, []);
  const { platform } = route.params;
  const width = Dimensions.get("window").width;
  const onPressTiles = (txt) => {
    console.log(txt);
  };
  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 25 }}>
      <Text className="font-bold text-lg mt-5 mb-3 capitalize">
        {item.category == "hikes" && "Hikes to do together"}
        {item.category == "movies" && "Movies to watch together "}
      </Text>
      <CarouselComp dataArr={item?.list} width={width} onPress={onPressTiles} />
    </View>
  );
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <View className={`flex-1 mx-7 ${platform == "ios" ? "mt-5" : "mt-16"} `}>
        <Text className="text-2xl font-bold mb-5">Explore</Text>
        <FlatList
          data={explores}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}
