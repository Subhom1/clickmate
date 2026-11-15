import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Pressable,
  TextInput,
  StyleSheet,
  Keyboard,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Auth } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import axios from "axios";
import { useAtom } from "jotai";
import { userState } from "../state/atoms/UserState";
import { API_BASE_URL } from "../../constant";
import Icon from "@expo/vector-icons/Feather";
import { InitialsCircle } from "../components/CreateAvatar";
import { useProfilePhotoEditor } from "../hooks/useProfilePhotoEditor";
import ProfilePhotoEditor from "../components/ProfilePhotoEditor";
import KeyboardDismissScrollView from "../components/KeyboardDismissScrollView";

export default function Profile() {
  const [userData, setUserData] = useAtom(userState);
  const [fullname, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [interests, setAllInterests] = useState([]);
  const [userInterestsIDs, setUserInterestsIDs] = useState([]);
  const [nameError, setNameError] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const photoEditor = useProfilePhotoEditor(userData, setUserData);
  useEffect(() => {
    getAllInterests();
  }, []);
  useEffect(() => {
    if (userData) {
      setUserInterestsIDs(userData.interests?.map((item) => item._id) ?? []);
      setFullName(userData.fullname ?? "");
      setBio(userData.bio ?? "");
    }
  }, [userData]);
  const signOutUser = () => {
    signOut(Auth)
      .then(() => {
        console.log("Sign out sucessful");
        setUserData(null);
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
          `${API_BASE_URL}/deleteUser/${userData._id}/${user.uid}`
        );
        // Delete the user from Firebase Auth
        await user.delete();
        setUserData(null);
      } catch (error) {
        console.error("Error deleting user account:", error);
      }
    }
  };
  const getAllInterests = async () => {
    try {
      if (!API_BASE_URL) throw new Error("A secure ClickMate API URL is required.");
      const res = await axios.get(`${API_BASE_URL}/interests`);
      setAllInterests(res.data);
    } catch (e) {
      console.error(e, "Error fetching interests");
    }
  };
  const updateUserData = async () => {
    Keyboard.dismiss();
    if (profileSaving) return;
    if (!fullname) {
      setNameError(true);
      return;
    }
    const newUserData = {
      fullname,
      bio,
      interests: userInterestsIDs,
    };
    setProfileSaving(true);
    setProfileError("");
    try {
      if (!userData?._id) throw new Error("Your profile is still loading. Please try again.");
      const token = await Auth.currentUser?.getIdToken();
      if (!token) throw new Error("Please sign in again to update your profile.");
      if (!API_BASE_URL) throw new Error("A secure ClickMate API URL is required.");
      const res = await axios.patch(`${API_BASE_URL}/user/${userData?._id}`, newUserData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData((current) => ({
        ...current,
        ...res.data,
        ...(current?.avatarUrl ? { avatarUrl: current.avatarUrl, avatarExpiresAt: current.avatarExpiresAt } : {}),
      }));
      setEditMode(false);
    } catch (e) {
      setProfileError(e?.response?.data?.message || e?.message || "Could not update profile. Please try again.");
      console.error(e, "Error updating user data");
    } finally {
      setProfileSaving(false);
    }
  };

  const inputFieldCSS = `border rounded-3xl p-3 pl-5 mt-3 text-gray-500 border-primary_green_light text-start`;
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="auto" />
      <KeyboardDismissScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile photo"
              onPress={() => photoEditor.setPhotoEditorOpen(true)}
              style={styles.avatarButton}
            >
              {userData?.avatarUrl ? <InitialsCircle
                name={userData?.fullname || ""}
                photoUri={userData?.avatarUrl}
                styles={{ circle: styles.profileAvatar, initials: styles.profileInitials }}
              /> : <View style={styles.photoPlaceholder}><Icon name="camera" size={28} color="#67AB0F" /><View style={styles.photoPlus}><Icon name="plus" size={16} color="white" /></View></View>}
            </Pressable>
            <View style={styles.headerActions}>
              {editMode ? (
                <>
                  <Pressable accessibilityRole="button" disabled={profileSaving} onPress={updateUserData} style={styles.saveEditButton}>
                    <Icon name="check" size={17} color="#fff" />
                    <Text style={styles.saveEditText}>{profileSaving ? "Saving..." : "Update"}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" disabled={profileSaving} onPress={() => {
                    setEditMode(false);
                    setNameError(false);
                    setProfileError("");
                  }} style={styles.headerTextButton}>
                    <Text style={styles.headerText}>Cancel</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable accessibilityRole="button" accessibilityLabel="Edit profile details" onPress={() => {
                    setEditMode(true);
                    setProfileError("");
                  }} style={styles.editIconButton}>
                    <Icon name="edit-2" size={19} color="#47790B" />
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={signOutUser} style={styles.headerTextButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
          {profileError ? <Text accessibilityRole="alert" style={styles.textError}>{profileError}</Text> : null}
          <View style={styles.identity}>
          {!editMode ? (
            <Text style={styles.profileName}>
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
          {nameError && !fullname ? <Text style={styles.textError}>Full name is required.</Text> : null}
          {!editMode ? (
            <Text style={styles.profileBio}>{userData?.bio}</Text>
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
        </View>

        {/* <TouchableOpacity
          className="rounded-full w-40 items-center justify-center py-2 mt-5 bg-primary_red"
          onPress={deleteAcc}
        >
          <Text className="text-white">Delete Account</Text>
        </TouchableOpacity> */}

        <View style={styles.interestsCard}>
          {!editMode ? (
            <>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View className="flex-row flex-wrap">
                {userData?.interests?.map((it) => (
                  <View
                    key={it._id}
                    style={styles.interestChip}
                  >
                    <Text style={styles.interestText}>{it.text}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Interests</Text>

              <View className="flex-row flex-wrap">
                {interests.map((it) => {
                  const isExists = userInterestsIDs.includes(it._id);
                  return (
                    <Pressable
                      key={it._id}
                      style={[styles.interestChip, !isExists && styles.interestChipInactive]}
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
                      <Text style={isExists ? styles.interestText : styles.interestTextInactive}>{it.text}</Text>
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
      </KeyboardDismissScrollView>
      <ProfilePhotoEditor avatarUrl={userData?.avatarUrl} editor={photoEditor} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7FAF5" },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 100, gap: 16 },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 28, borderWidth: 1, borderColor: "#E8F0E2", padding: 20 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  avatarButton: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  profileAvatar: { width: 88, height: 88, borderRadius: 44, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#A7B0AD" },
  profileInitials: { color: "#FFFFFF", fontSize: 25, fontWeight: "600" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  editIconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFF6E9", alignItems: "center", justifyContent: "center" },
  headerTextButton: { minHeight: 44, paddingHorizontal: 10, justifyContent: "center", alignItems: "center" },
  headerText: { color: "#4B5A48", fontSize: 14, fontWeight: "500" },
  logoutText: { color: "#AB0F12", fontSize: 14, fontWeight: "600" },
  saveEditButton: { minHeight: 44, paddingHorizontal: 13, borderRadius: 22, backgroundColor: "#67AB0F", flexDirection: "row", gap: 5, alignItems: "center" },
  saveEditText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  identity: { marginTop: 18 },
  profileName: { color: "#172115", fontSize: 26, fontWeight: "700", lineHeight: 32, textTransform: "capitalize" },
  profileBio: { color: "#667263", fontSize: 15, lineHeight: 22, marginTop: 6 },
  interestsCard: { backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#E8F0E2", paddingHorizontal: 20, paddingTop: 19, paddingBottom: 13 },
  sectionTitle: { color: "#172115", fontSize: 18, fontWeight: "600", marginBottom: 15 },
  interestChip: { backgroundColor: "#EAF5E3", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  interestChipInactive: { backgroundColor: "#F1F3F0" },
  interestText: { color: "#47790B", fontSize: 14, fontWeight: "500" },
  interestTextInactive: { color: "#788375", fontSize: 14, fontWeight: "500" },
  textError: {
    color: "#AB0F12",
    fontSize: 13,
    marginTop: 8,
  },
  photoPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#EAF5E3", borderWidth: 1, borderColor: "#A7D27C", alignItems: "center", justifyContent: "center" },
  photoPlus: { position: "absolute", right: -1, bottom: -1, width: 26, height: 26, borderRadius: 13, backgroundColor: "#67AB0F", alignItems: "center", justifyContent: "center" },
});
