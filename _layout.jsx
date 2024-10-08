import React, { useEffect, useState } from "react";
import { StyleSheet, Keyboard } from "react-native";
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
import { userState } from "./app/state/atoms/UserState";
import { useRecoilState } from "recoil";
import ChatScreen from "./app/screens/ChatScreen/ChatScreen";
import { InitialsCircle } from "./app/components/CreateAvatar";
import VisitorProfile from "./app/screens/VisitorProfile";
import ExploreSearch from "./app/screens/ExploreSearch";

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
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{ headerShown: false }}
              initialParams={{ platform }}
            />
            <Stack.Screen
              name="VisitorProfile"
              component={VisitorProfile}
              options={{ headerShown: false }}
              initialParams={{ platform }}
            />
            <Stack.Screen
              name="ExploreSearch"
              component={ExploreSearch}
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
const MyTabs = ({ route }) => {
  const [userData, setUserData] = useRecoilState(userState);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(-e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  const { platform } = route.params;
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          height: platform == "ios" ? 90 : 75,
          borderTopRightRadius: 30,
          borderTopLeftRadius: 30,
          paddingTop: platform == "ios" ? 15 : 15,
          paddingBottom: platform == "ios" ? 30 : 15,
          shadowOpacity: 0.1,
          shadowRadius: 5,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: isKeyboardVisible
            ? platform == "ios"
              ? 0
              : keyboardHeight
            : 0,
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
        initialParams={route.params}
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
          headerShown: false,
        }}
        initialParams={route.params}
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
          headerShown: false,
        }}
        initialParams={route.params}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <InitialsCircle
              name={userData ? userData?.fullname : ""}
              focused={focused}
              styles={styles}
              nav={true}
            />
          ),
          tabBarActiveTintColor: "#67AB0F",
          tabBarInactiveTintColor: "#A7B0AD",
          headerShown: false,
        }}
        initialParams={route.params}
      />
    </Tab.Navigator>
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
