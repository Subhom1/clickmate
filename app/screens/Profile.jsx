import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Pressable,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import axios from "axios";
import { useRecoilState, useSetRecoilState } from "recoil";
import { userState } from "../state/atoms/UserState";
import { IP } from "../../constant";
import Icon from "react-native-vector-icons/Feather";

export default function Profile({ route }) {
  const [userData, setUserData] = useRecoilState(userState);
  const setUserStateData = useSetRecoilState(userState);
  const [fullname, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [interests, setAllInterests] = useState([]);
  const [userInterestsIDs, setUserInterestsIDs] = useState([]);
  useEffect(() => {
    getAllInterests();
  }, []);
  useEffect(() => {
    if (userData) {
      setUserInterestsIDs(userData?.interests.map((item) => item._id));
      setFullName(userData?.fullname);
      setBio(userData?.bio);
    }
  }, [userData]);
  const signOutt = () => {
    signOut(Auth)
      .then(() => {
        console.log("Sign out sucessful");
        setUserStateData(null);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const deleteAcc = async () => {
    const user = Auth.currentUser;
    if (user) {
      try {
        // Backend to delete the user from Firebase Auth and MongoDB
        await axios.delete(
          `http://${IP}:5051/deleteUser/${userData._id}/${user.uid}`
        );
        // Delete the user from Firebase Auth
        await user.delete();
        setUserStateData(null);
      } catch (error) {
        console.error("Error deleting user account:", error);
      }
    }
  };
  const getAllInterests = async () => {
    await axios
      .get(`http://${IP}:5051/interests`)
      .then((res) => setAllInterests(res.data))
      .catch((e) => console.error(e, "Error fetching interests"));
  };
  const updateUserData = async () => {
    const newUserData = {
      fullname,
      bio,
      interests: userInterestsIDs,
    };
    await axios
      .patch(`http://${IP}:5051/user/${userData?._id}`, newUserData)
      .then((res) => {
        console.log(res.data, "res");
        setUserStateData(res.data);
        setEditMode((editMode) => !editMode);
      })
      .catch((e) => console.error(e, "Error updating user data"));
  };

  const { platform } = route.params;
  const inputFieldCSS = `border rounded-3xl p-3 pl-5 text-gray-500 border-primary_green_light text-start`;
  return (
    <SafeAreaView className="flex-1 mx-7">
      <StatusBar style="auto" />
      <View
        className={`flex-row items-center justify-end ${
          platform == "ios" ? "mt-5" : "mt-16"
        }`}
      >
        {editMode ? (
          <Pressable
            onPress={() => {
              updateUserData();
            }}
            className="flex-row items-center"
          >
            <Icon name="check" size={20} />
            <Text className="ml-2">Update</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              className="mr-5"
              onPress={() => {
                setEditMode((editMode) => !editMode);
              }}
            >
              <Icon name="edit" size={20} />
            </Pressable>
            <Icon name="settings" size={20} />
          </>
        )}
        <Pressable onPress={signOutt} className="ml-5">
          <Text className="text-primary_red">Logout</Text>
        </Pressable>
      </View>
      <View className="mt-5">
        {!editMode ? (
          <Text className="text-2xl font-medium capitalize">
            {userData?.fullname}
          </Text>
        ) : (
          <TextInput
            placeholder="Enter your full name"
            className={inputFieldCSS}
            onChangeText={(name) => {
              setFullName(name);
            }}
            autoCapitalize="none"
            value={fullname}
          />
        )}
      </View>
      <View className="my-5">
        {!editMode ? (
          <Text className="text-gray-600">{userData?.bio}</Text>
        ) : (
          <TextInput
            placeholder="Describe your personality in short"
            className={inputFieldCSS}
            onChangeText={(bio) => {
              setBio(bio);
            }}
            autoCapitalize="none"
            value={bio}
            multiline={true}
            maxLength={200}
            style={{ height: 100 }}
          />
        )}
      </View>

      {/* <TouchableOpacity
          className="rounded-full w-40 items-center justify-center py-2 mt-5 bg-primary_red"
          onPress={deleteAcc}
        >
          <Text className="text-white">Delete Account</Text>
        </TouchableOpacity> */}

      <View>
        {!editMode ? (
          <View className="flex-row flex-wrap">
            {userData?.interests.map((it, index) => (
              <View
                key={it._id}
                className="px-4 py-2 rounded-full mb-2 mr-2 bg-primary_green_light"
              >
                <Text className="text-white">{it.text}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-row flex-wrap">
            {interests.map((it, index) => {
              const isExists = userInterestsIDs.includes(it._id);
              return (
                <Pressable
                  key={it._id}
                  className={`px-4 py-2 rounded-full mb-2 mr-2 ${
                    isExists ? "bg-primary_green_light" : "bg-gray-400"
                  }`}
                  onPress={() => {
                    if (isExists) {
                      // If the item exists, remove it from userInterestsIDs
                      setUserInterestsIDs((prev) =>
                        prev.filter((interestId) => interestId !== it._id)
                      );
                    } else {
                      // If the item does not exist, add it to userInterestsIDs
                      setUserInterestsIDs((prev) => [...prev, it._id]);
                    }
                  }}
                >
                  <Text className="text-white">{it.text}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
