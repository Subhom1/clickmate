import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import axios from "axios";
import { useAtom, useSetAtom } from "jotai";
import { userState } from "../state/atoms/UserState";
import { IP } from "../../constant";
import Icon from "@expo/vector-icons/Feather";
import { InitialsCircle } from "../components/CreateAvatar";
import { selectProfilePhoto } from "../profilePhoto/selectPhoto";
import { profilePhotoApi } from "../profilePhoto/api";

export default function Profile({ route }) {
  const [userData, setUserData] = useAtom(userState);
  const setUserStateData = useSetAtom(userState);
  const [fullname, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [interests, setAllInterests] = useState([]);
  const [userInterestsIDs, setUserInterestsIDs] = useState([]);
  const [nameError, setNameError] = useState(false);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoDraft, setPhotoDraft] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoProgress, setPhotoProgress] = useState(null);
  const choosePhoto = async (source) => {
    if (photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const selected = await selectProfilePhoto(source);
      if (selected) setPhotoDraft(selected);
    } catch (error) {
      setPhotoError(error?.message || "The photo could not be prepared.");
    } finally {
      setPhotoBusy(false);
    }
  };
  const closePhotoEditor = () => {
    if (photoBusy) return;
    setPhotoDraft(null);
    setPhotoError("");
    setPhotoProgress(null);
    setPhotoEditorOpen(false);
  };
  const savePhoto = async () => {
    if (!photoDraft || !userData?._id || photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    setPhotoProgress(0);
    try {
      const result = await profilePhotoApi.save(userData._id, photoDraft, setPhotoProgress);
      if (!result?.avatarUrl) throw new Error("The updated profile photo was not returned.");
      setUserData((current) => ({ ...current, avatarUrl: result.avatarUrl }));
      setPhotoDraft(null);
      setPhotoProgress(null);
      setPhotoEditorOpen(false);
    } catch (error) {
      setPhotoError(error?.message || "The photo could not be saved.");
    } finally {
      setPhotoBusy(false);
    }
  };
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
    if (!fullname) {
      setNameError(true);
      return;
    }
    const newUserData = {
      fullname,
      bio,
      interests: userInterestsIDs,
    };
    await axios
      .patch(`http://${IP}:5051/user/${userData?._id}`, newUserData)
      .then((res) => {
        setUserStateData(res.data);
        setEditMode((editMode) => !editMode);
      })
      .catch((e) => console.error(e, "Error updating user data"));
  };

  const { platform } = route.params;
  const inputFieldCSS = `border rounded-3xl p-3 pl-5 mt-3 text-gray-500 border-primary_green_light text-start`;
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <ScrollView
        className="mx-7"
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile photo"
          onPress={() => setPhotoEditorOpen(true)}
          className="self-center mt-8 mb-3"
          style={{ minWidth: 72, minHeight: 72, alignItems: "center", justifyContent: "center" }}
        >
          <InitialsCircle
            name={userData?.fullname || ""}
            photoUri={userData?.avatarUrl}
            styles={{ circle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#A7B0AD", overflow: "hidden", alignItems: "center", justifyContent: "center" }, initials: { color: "white", fontSize: 22 } }}
          />
          <Text className="text-primary_green mt-1">Edit photo</Text>
        </Pressable>
        <View
          className={`flex-row items-center justify-end ${
            platform == "ios" ? "mt-5" : "mt-16"
          }`}
        >
          {editMode ? (
            <>
              <Pressable
                onPress={() => {
                  updateUserData();
                }}
                className="flex-row items-center"
              >
                <Icon name="check" size={20} />
                <Text className="ml-1">Update</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditMode(false);
                  setNameError(false);
                }}
                className="flex-row items-center"
              >
                <Text className="ml-5">Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                className="mr-3"
                onPress={() => {
                  setEditMode((editMode) => !editMode);
                }}
              >
                <Icon name="edit" size={20} />
              </Pressable>
              {/* <Icon name="settings" size={20} /> */}
            </>
          )}
          {!editMode && (
            <Pressable onPress={signOutt} className="ml-5">
              <Text className="text-primary_red">Logout</Text>
            </Pressable>
          )}
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
          {nameError && !fullname ? (
            <Text style={styles.textError} className="pl-5 mt-1">
              *fullname is required
            </Text>
          ) : (
            <Text className="mt-1.5 h-3"></Text>
          )}
        </View>
        <View className="">
          {!editMode ? (
            <Text className="text-gray-600 mb-7">{userData?.bio}</Text>
          ) : (
            <TextInput
              placeholder="Describe your personality in short"
              className={`${inputFieldCSS} mt-3 mb-5 pt-2`}
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
            <>
              <Text className="mb-3 font-medium">Interests</Text>
              <View className="flex-row flex-wrap">
                {userData?.interests.map((it, index) => (
                  <View
                    key={it._id}
                    className="px-4 py-2 rounded-full mb-2 mr-1 bg-primary_green_light"
                  >
                    <Text className="text-white">{it.text}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text className="mb-3 font-medium">Interests</Text>

              <View className="flex-row flex-wrap">
                {interests.map((it, index) => {
                  const isExists = userInterestsIDs.includes(it._id);
                  return (
                    <Pressable
                      key={it._id}
                      className={`px-4 py-2 rounded-full mb-2 mr-1 ${
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
            </>
          )}
        </View>
        {editMode && (
          <TouchableOpacity
            className="rounded-full w-40 items-center justify-center py-2 mt-5 bg-primary_red"
            onPress={deleteAcc}
          >
            <Text className="text-white">Delete Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <Modal visible={photoEditorOpen} animationType="slide" transparent onRequestClose={closePhotoEditor}>
        <SafeAreaView style={styles.photoBackdrop}>
          <View style={styles.photoSheet}>
            <Text style={styles.photoTitle}>Profile photo</Text>
            {photoDraft ? (
              <Image
                accessibilityLabel="Cropped photo preview"
                source={{ uri: photoDraft.uri }}
                style={styles.photoPreview}
              />
            ) : null}
            {photoBusy && <ActivityIndicator accessibilityLabel={photoProgress === null ? "Preparing photo" : "Uploading photo"} color="#67AB0F" />}
            {photoProgress !== null && photoBusy && (
              <Text accessibilityLiveRegion="polite" accessibilityLabel="Photo upload progress">
                {`Uploading photo: ${Math.round(photoProgress * 100)}%`}
              </Text>
            )}
            <Pressable accessibilityRole="button" disabled={photoBusy} onPress={() => choosePhoto("library")} style={styles.photoAction}>
              <Text>Choose from gallery</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={photoBusy} onPress={() => choosePhoto("camera")} style={styles.photoAction}>
              <Text>Take photo</Text>
            </Pressable>
            {photoDraft && (
              <Pressable accessibilityRole="button" disabled={photoBusy} onPress={savePhoto} style={styles.photoAction}>
                <Text>Save photo</Text>
              </Pressable>
            )}
            {!!photoError && <Text accessibilityRole="alert" style={styles.photoError}>{photoError}</Text>}
            <Pressable accessibilityRole="button" disabled={photoBusy} onPress={closePhotoEditor} style={styles.photoAction}>
              <Text>Cancel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  textError: {
    color: "#AB0F12",
    fontSize: 12,
  },
  photoBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0006" },
  photoSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: "center", gap: 12 },
  photoTitle: { fontSize: 20, fontWeight: "600" },
  photoPreview: { width: 220, height: 220, borderRadius: 110 },
  photoAction: { minHeight: 48, minWidth: 220, borderRadius: 24, backgroundColor: "#EAF5E3", justifyContent: "center", alignItems: "center" },
  photoError: { color: "#AB0F12", textAlign: "center" },
});
