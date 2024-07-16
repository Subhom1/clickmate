import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./app/screens/Login";
import SignUp from "./app/screens/SignUp";
import Home from "./app/screens/Home";

export default function RootLayout({ user, platform }) {
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Home" : "Login"}>
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
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: true }}
          initialParams={{ platform }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
