import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./app/screens/Login";
import SignUp from "./app/screens/SignUp";
import Home from "./app/screens/Home";
import Explore from "./app/screens/Explore";
import People from "./app/screens/People";
import Profile from "./app/screens/Profile";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Entypo";
import Icon2 from "react-native-vector-icons/Octicons";
import Icon3 from "react-native-vector-icons/EvilIcons";

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
const MyTabs = () => {
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
        }}
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
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Icon3
              name="user"
              size={25}
              color={`${focused ? "#67AB0F" : "#A7B0AD"}`}
            />
          ),
          tabBarActiveTintColor: "#67AB0F",
          tabBarInactiveTintColor: "#A7B0AD",
        }}
      />
    </Tab.Navigator>
  );
};
