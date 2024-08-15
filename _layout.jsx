import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./app/screens/Login";
import SignUp from "./app/screens/SignUp";
import Home from "./app/screens/Home";
import Explore from "./app/screens/Explore";
import People from "./app/screens/People";
import Profile from "./app/screens/Profile";
import Result from "./app/screens/Result";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Entypo";
import Icon2 from "react-native-vector-icons/Octicons";
import Icon3 from "react-native-vector-icons/EvilIcons";
import axios from "axios";
import { userState } from "./app/state/atoms/UserState";
import { useRecoilState } from "recoil";
import CallScreen from "./app/screens/CallScreen";
import ChatScreen from "./app/screens/ChatScreen/ChatScreen";

export const RootLayout = ({ user, platform }) => {
  const [isTokenValid, setIsTokenValid] = useState("");
  useEffect(() => {
    if (user) {
      const expirationTime = user?.stsTokenManager?.expirationTime;
      const tokenValid = expirationTime > Date.now();
      setIsTokenValid(tokenValid);
    } else {
      setIsTokenValid(false);
    }
  }, [user]);

  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isTokenValid ? (
          <>
            <Stack.Screen
              name="Tab"
              component={MyTabs}
              options={{ headerShown: false }}
              initialParams={{ platform }}
              />
            <Stack.Screen
              name="Result"
              component={Result}
              options={{ headerShown: false }}
              initialParams={{ platform }}
              />
            {/* <Stack.Screen
              name="CallScreen"
              component={CallScreen}
              options={{ headerShown: false }}
              initialParams={{ platform }}
            /> */}
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{ headerShown: false }}
              initialParams={{ platform }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
              initialParams={{ platform }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUp}
              options={{ headerShown: false }}
              initialParams={{ platform }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const Tab = createBottomTabNavigator();
const MyTabs = ({route}) => {
  const [userData, setUserData] = useRecoilState(userState);
  const [userFullname, setUserFullname] = useState("");
  useEffect(() => {
    if (userData) {
      setUserFullname(userData.fullname);
    }
  }, [userData]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          height: 90,
          borderRadius: 30,
          paddingTop: 10,
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Icon2
              name="home"
              size={25}
              color={`${focused ? "#67AB0F" : "#A7B0AD"}`}
            />
          ),
          tabBarActiveTintColor: "#67AB0F",
          tabBarInactiveTintColor: "#A7B0AD",
          headerShown: false,
        }}
        initialParams={route}
      />
      <Tab.Screen
        name="Explore"
        component={Explore}
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <Icon
              name="compass"
              size={25}
              color={`${focused ? "#67AB0F" : "#A7B0AD"}`}
            />
          ),
          tabBarActiveTintColor: "#67AB0F",
          tabBarInactiveTintColor: "#A7B0AD",
        }}
        initialParams={route}
      />
      <Tab.Screen
        name="People"
        component={People}
        options={{
          title: "People",
          tabBarIcon: ({ focused }) => (
            <Icon2
              name="people"
              size={25}
              color={`${focused ? "#67AB0F" : "#A7B0AD"}`}
            />
          ),
          tabBarActiveTintColor: "#67AB0F",
          tabBarInactiveTintColor: "#A7B0AD",
        }}
        initialParams={route}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <InitialsCircle name={userFullname} focused={focused} />
          ),
          tabBarActiveTintColor: "#67AB0F",
          tabBarInactiveTintColor: "#A7B0AD",
        }}
        initialParams={route}
      />
    </Tab.Navigator>
  );
};
const getInitials = (name) => {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase();
};
const InitialsCircle = ({ name, focused }) => {
  const initials = getInitials(name);
  const backgroundColor = focused ? "#67AB0F" : "#A7B0AD";
  return (
    <View style={[styles.circle, { backgroundColor }]}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
