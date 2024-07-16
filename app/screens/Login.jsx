import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import Checkbox from "expo-checkbox";
import Icon from "react-native-vector-icons/Octicons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Auth } from "../../FirebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function Login() {
  const [isChecked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { platform } = route.params;
  const signInEmailPw = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(Auth, email, password);
      console.log(response);
    } catch (error) {
      console.error(error);
      alert("Sign In failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      <View className={`mx-5  mb-5 ${platform=='android' ? 'mt-36' :'mt-20'}`}>
        <Text className="text-left text-5xl font-bold text-primary_green">
          Welcome
        </Text>
        <Text className="text-left text-5xl font-bold text-black">back!</Text>
      </View>
      <Text className="text-gray-500 mx-5">
        You never know who is waiting for you 😉
      </Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#9AA3B1"
          className="flex w-full h-80 justify-center items-center "
        />
      ) : (
        <View className="mt-5 mx-5">
          <View className="relative">
            <Icon
              name="mail"
              size={16}
              color="#C6C6C8"
              style={styles.loginIcons}
            />
            <TextInput
              placeholder="Enter your email/phone number"
              className="border rounded-full p-4 pl-14 text-gray-500 border-primary_green_light mt-1 font-roboto"
              onChangeText={(emailtxt) => setEmail(emailtxt)}
              autoCapitalize="none"
              value={email}
            />
          </View>
          <View className="relative mt-3">
            <Icon
              name="lock"
              size={16}
              color="#C6C6C8"
              style={styles.loginIcons}
            />
            <TextInput
              placeholder="Enter your password"
              className="border rounded-full p-4 pl-14 text-gray-500 border-primary_green_light mt-1 font-roboto"
              onChangeText={(pw) => setPassword(pw)}
              autoCapitalize="none"
              value={password}
              secureTextEntry={true}
            />
          </View>
          <View className="mt-3 flex-row items-center">
            <Checkbox
              style={styles.checkbox}
              value={isChecked}
              onValueChange={setChecked}
              color={isChecked ? "#67AB0F" : undefined}
              className="ml-7"
            />
            <Text className="ml-2 text-gray-500">Remember me</Text>
          </View>
          <TouchableOpacity
            className="bg-primary_green py-4 mt-6 mb-3 rounded-full"
            onPress={signInEmailPw}
          >
            <Text className="text-center text-sm text-white">Login</Text>
          </TouchableOpacity>
          <Text className="text-center font-normal text-gray-500 text-base mt-3">
            or
          </Text>
          <TouchableOpacity className="rounded-full flex items-center justify-center py-4 mt-5 bg-secondary_green_deep">
            <Text className="text-white text-sm ">Sign In With Google</Text>
          </TouchableOpacity>
          <View className="mt-6 flex-row justify-center">
            <Text className="font-roboto">Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("SignUp");
              }}
            >
              <Text className="text-primary_green_light">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 14,
    height: 14,
    borderColor: "#C6C6C8",
  },
  loginIcons: {
    position: "absolute",
    left: 28,
    top: "38%",
  },
});
