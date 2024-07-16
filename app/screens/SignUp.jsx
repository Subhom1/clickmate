import React, { useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import Checkbox from "expo-checkbox";
import Icon from "react-native-vector-icons/Octicons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useFonts } from "expo-font";
import { ActivityIndicator } from "react-native";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";
import { Auth } from "../../FirebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
WebBrowser.maybeCompleteAuthSession();

export default function Signup() {
  // Load the font
  // const [loaded] = useFonts({
  //   Roboto: require("../../assets/fonts/Roboto-Regular.ttf"),
  //   "Roboto-Bold": require("../../assets/fonts/Roboto-Bold.ttf"),
  // });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [invalidMail, setInvalidMail] = useState(false);
  const [passLengthErr, setPassLengthErr] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { platform } = route.params;

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const signUpEmailPw = async () => {
    if (!error) {
      setLoading(true);
      try {
        const response = await createUserWithEmailAndPassword(
          Auth,
          email,
          password
        );
        console.log(response);
        alert("Check your email!");
      } catch (error) {
        console.error(error);
        alert("Registration failed: " + error.message);
      } finally {
        setLoading(false);
      }
    } else {
    }
  };
  const checkIsValid = () => {
    if (!name || !email || !password || password !== confirmpassword) {
      setError(true);
    } else if (!validateEmail(email)) {
      setInvalidMail(true);
    } else if (password.length < 6) {
      setPassLengthErr(true);
    } else {
      setInvalidMail(false);
      setError(false);
      setPassLengthErr(false);
      signUpEmailPw();
    }
  };

  // if (!loaded) {
  //   return null;
  // }

  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      {/* Total view */}

      {/*Top header  */}
      <View className={`mx-5 mb-5 ${platform == "android" ? "mt-20": 'mt-9'}`}>
        <Text className="text-left text-5xl font-bold text-primary_green">
          Start Your
        </Text>
        <Text className="text-left text-5xl font-bold text-black">journey</Text>
      </View>
      <Text className="text-gray-500 mx-5">and find mate for life . . .</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#9AA3B1"
          className="flex w-full h-80 justify-center items-center "
        />
      ) : (
        // All Signup and below part
        <View className="mt-5 mx-5">
          {/* name field */}
          <View className="relative">
            <Icon
              name="person"
              size={16}
              color="#C6C6C8"
              style={styles.signupIcons}
            />
            <TextInput
              placeholder="Enter your full name"
              className="border rounded-full p-4 pl-14 text-gray-500 border-primary_green_light mt-1 font-roboto"
              onChangeText={(name) => {
                setName(name);
              }}
              autoCapitalize="none"
              value={name}
            />
          </View>
          {error && !name ? (
            <Text style={styles.textError} className="pl-14 mt-1">
              *name is required
            </Text>
          ) : (
            <Text className="mt-1.5 h-3"></Text>
          )}
          {/* email field */}
          <View className="relative mt-1.5">
            <Icon
              name="mail"
              size={16}
              color="#C6C6C8"
              style={styles.signupIcons}
            />
            <TextInput
              placeholder="Enter your email/phone number"
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
            <Text className="mt-1.5 h-3"></Text>
          )}
          {/* password field */}
          <View className="relative mt-1.5">
            <Icon
              name="lock"
              size={16}
              color="#C6C6C8"
              style={styles.signupIcons}
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
          ) : passLengthErr ? (
            <Text style={styles.textError} className="pl-14 mt-1">
              *password is too short
            </Text>
          ) : (
            <Text className="mt-1.5 h-3"></Text>
          )}
          {/* confirm password field */}
          <View className="relative mt-1.5">
            <Icon
              name="lock"
              size={16}
              color="#C6C6C8"
              style={styles.signupIcons}
            />
            <TextInput
              placeholder="Confirm password"
              className="border rounded-full p-4 pl-14 text-gray-500 border-primary_green_light mt-1 font-roboto"
              onChangeText={(confirmpassword) =>
                setConfirmPassword(confirmpassword)
              }
              autoCapitalize="none"
              value={confirmpassword}
            />
          </View>
          {error && password !== confirmpassword && confirmpassword ? (
            <Text style={styles.textError} className="pl-14 mt-1">
              *password does not match
            </Text>
          ) : (
            <Text className="mt-1.5 h-3"></Text>
          )}

          <TouchableOpacity
            className="bg-primary_green py-4 mt-6 mb-3 rounded-full"
            onPress={checkIsValid}
          >
            <Text className="text-center text-sm text-white">Sign Up</Text>
          </TouchableOpacity>

          <Text className="text-center font-normal text-gray-500 text-base mt-3">
            or
          </Text>

          <TouchableOpacity
            className="rounded-full flex items-center justify-center py-4 mt-5 bg-secondary_green_deep"
            onPress={signUpEmailPw}
          >
            <Text className="text-white text-sm ">Sign Up With Google</Text>
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center">
            <Text className="font-roboto">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Login");
              }}
            >
              <Text className="text-primary_green_light">Login</Text>
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
  signupIcons: {
    position: "absolute",
    left: 28,
    top: "38%",
  },
  textError: {
    color: "#AB0F12",
    fontSize: 12,
  },
});
