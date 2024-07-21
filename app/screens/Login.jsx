import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import Checkbox from "expo-checkbox";
import Icon from "react-native-vector-icons/Octicons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider } from "firebase/auth";
import { Auth } from "../../FirebaseConfig";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
// WebBrowser.maybeCompleteAuthSession();
export default function Login() {
  const [isChecked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [invalidMail, setInvalidMail] = useState(false);
  const navigation = useNavigation();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const checkIsValid = () => {
    if (!email || !password) {
      setError(true);
    } else if (!validateEmail(email)) {
      setInvalidMail(true);
    } else {
      setInvalidMail(false);
      setError(false);
      signInEmailPw();
    }
  };
  const signInEmailPw = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(Auth, email, password);
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
      <View
        className={`mx-5  mb-5 ${Platform.OS == "android" ? "mt-24" : "mt-20"}`}
      >
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
        <View className="mt-7 mx-5">
          <View className="relative">
            <Icon
              name="mail"
              size={16}
              color="#C6C6C8"
              style={styles.loginIcons}
            />
            <TextInput
              placeholder="Enter your email"
              className="border rounded-full p-4 pl-14 text-gray-500 border-primary_green_light mt-1 font-roboto"
              onChangeText={(emailtxt) => {
                setInvalidMail(!validateEmail(emailtxt));
                setEmail(emailtxt);
              }}
              autoCapitalize="none"
              value={email}
            />
          </View>
          {error && !email ? (
            <Text style={styles.textError} className="pl-14 mt-1">
              *email is required
            </Text>
          ) : invalidMail ? (
            <Text style={styles.textError} className="pl-14 mt-1">
              *email is invalid
            </Text>
          ) : (
            <Text className="h-3 mt-1"></Text>
          )}
          <View className="relative mt-1">
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
          {error && !password ? (
            <Text style={styles.textError} className="pl-14 mt-1">
              *password is required
            </Text>
          ) : (
            <Text className="mt-1.5 h-3"></Text>
          )}
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
            onPress={checkIsValid}
          >
            <Text className="text-center text-sm text-white">Login</Text>
          </TouchableOpacity>
          <Text className="text-center font-normal text-gray-500 text-base mt-3">
            or
          </Text>
          <TouchableOpacity
            className="rounded-full flex items-center justify-center py-4 mt-5 bg-primary_gray"
            disabled
          >
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
  textError: {
    color: "#AB0F12",
    fontSize: 12,
  },
});
