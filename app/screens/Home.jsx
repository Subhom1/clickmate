import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Alert,
  Keyboard,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import KeyboardDismissScrollView from "../components/KeyboardDismissScrollView";
import Icon2 from "@expo/vector-icons/Feather";
import { acquireAuthenticatedSocket, releaseAuthenticatedSocket } from "../network/socket";
import { userState } from "../state/atoms/UserState";
import { useAtomValue, useSetAtom } from "jotai";
import { matchState } from "../state/atoms/MatchState";
import { useNavigation } from "@react-navigation/native";
import ToggleSwitch from "../components/ToggleSwitch.js";
import SearchSchedulePicker from "../components/SearchSchedulePicker";
import colors from "../theme/colors";

export default function Home({ route }) {
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState(null);
  const [searchTime, setSearchTime] = useState(null);
  const userData = useAtomValue(userState);
  const [searchLoading, setSearchLoading] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const [socket, setSocket] = useState(null);
  const noResultTimerRef = useRef(null);
  // Ignore shared socket results when Home has no active search.
  const searchActiveRef = useRef(false);
  const setMatchResult = useSetAtom(matchState);
  const navigation = useNavigation();
  const { platform } = route.params;

  useEffect(() => {
    if (!userData?._id) return;
    const newSocket = acquireAuthenticatedSocket(userData._id);

    setSocket(newSocket);
    const onConnect = () => {
      console.log("Client Connected to WebSocket server");
    };
    const onSearchUpdate = (data) => {
      if (!searchActiveRef.current) return;
      searchActiveRef.current = false;
      const match = data?.matches;

      setSearchLoading(false);
      if (noResultTimerRef.current) {
        clearTimeout(noResultTimerRef.current);
      }
      if (match?.user?._id) {
        setMatchResult(match);
        navigation.navigate("Result");
      } else {
        setMatchResult(null);
        setNoResult(true);
        noResultTimerRef.current = setTimeout(() => {
          setNoResult(false);
        }, 10000);
      }
    };
    const onError = (error) => {
      if (!searchActiveRef.current) return;
      searchActiveRef.current = false;
      console.error("Error from server:", error.message);
      Alert.alert("Error", error.message || "Something went wrong");
      setSearchLoading(false);
    };
    newSocket.on("connect", onConnect);
    newSocket.on("search_update", onSearchUpdate);
    newSocket.on("error", onError);

    return () => {
      if (noResultTimerRef.current) {
        clearTimeout(noResultTimerRef.current);
      }
      newSocket.off("connect", onConnect);
      newSocket.off("search_update", onSearchUpdate);
      newSocket.off("error", onError);
      releaseAuthenticatedSocket(userData._id, newSocket);
    };
  }, [userData?._id]);

  const handleSearch = () => {
    const query = searchText.trim();

    if (query === "") {
      Alert.alert("Search required", "Please enter a search query");
      return;
    }
    if (!userData?._id) {
      Alert.alert("Please wait", "Your profile is still loading");
      return;
    }
    if (!socket?.connected) {
      Alert.alert("Connection unavailable", "Please try again in a moment");
      return;
    }
    Keyboard.dismiss();
    searchActiveRef.current = true;
    setSearchLoading(true);
    setNoResult(false);
    if (noResultTimerRef.current) {
      clearTimeout(noResultTimerRef.current);
    }
    socket.emit("submit_keyword", {
      userId: userData._id,
      query,
      ...(searchDate ? { date: searchDate } : {}),
      ...(searchTime ? { time: searchTime } : {}),
    });
  };

  const handleCancelSearch = () => {
    searchActiveRef.current = false;
    if (socket?.connected && userData?._id) {
      socket.emit("cancel_search", { userId: userData._id });
    }
    setSearchLoading(false);
  };
  const tags = ["friendship", "city tour", "date"];
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={platform === "ios" ? "padding" : undefined}
      >
        <KeyboardDismissScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: platform === "ios" ? 102 : 87 }}
        >
          <View style={styles.content}>
            <View>
              <Text style={styles.heading}>Make plans, <Text style={styles.headingAccent}>together.</Text></Text>
              <Text style={styles.description}>Tell us what you&apos;re up for.</Text>
            </View>

            <View>
              <View style={styles.scopeRow}>
                <Text style={styles.sectionLabel}>YOUR SEARCH</Text>
                <ToggleSwitch />
              </View>
              <View style={styles.card}>
                <View style={styles.labelRow}>
                  <View style={styles.labelIcon}><Icon2 name="edit-3" size={15} color={colors.secondary_green_deep} /></View>
                  <Text style={styles.fieldTitle}>Your note</Text>
                </View>
                <TextInput
                  placeholder="Type your current mood"
                  placeholderTextColor={colors.text_subtle}
                  style={styles.notesInput}
                  onChangeText={setSearchText}
                  autoCapitalize="sentences"
                  value={searchText}
                  multiline
                  maxLength={400}
                  textAlignVertical="top"
                  accessibilityLabel="Search notes"
                />
                <Text style={styles.characterCount}>{searchText.length}/400</Text>
              </View>
            </View>

            <View>
              <View style={styles.suggestionHeader}>
                <Text style={styles.sectionLabel}>QUICK IDEAS</Text>
              </View>
              <View style={styles.tags}>
                {tags.map((item, index) => (
                  <Pressable onPress={() => setSearchText(item)} key={index} style={styles.tag}>
                    <Text style={styles.tagText}># {item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <View style={styles.scheduleHeader}>
                <Text style={styles.sectionLabel}>WHEN ARE YOU FREE?</Text>
                <Text style={styles.optional}>OPTIONAL</Text>
              </View>
              <View style={styles.pickerRow}>
                <SearchSchedulePicker mode="date" value={searchDate} onChange={setSearchDate} />
                <SearchSchedulePicker mode="time" value={searchTime} onChange={setSearchTime} />
              </View>
            </View>

            <View>
              {noResult && <Text style={styles.noResult}>No Users found. Try to be more specific about your search.</Text>}
              <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.searchButton, searchLoading && styles.disabledButton]}
                onPress={handleSearch}
                disabled={searchLoading}
                accessibilityRole="button"
              >
                {searchLoading ? (
                  <Text style={styles.searchButtonText}>Searching . . .</Text>
                ) : (
                  <><Text style={styles.searchButtonText}>Search</Text><Icon2 name="arrow-right" size={18} color={colors.surface} /></>
                )}
              </TouchableOpacity>
              {searchLoading && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSearch}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              </View>
            </View>
          </View>
        </KeyboardDismissScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: "space-evenly", paddingHorizontal: 22, paddingTop: 8 },
  heading: { fontSize: 28, fontWeight: "800", lineHeight: 34, color: colors.text_strong, letterSpacing: -0.8 },
  headingAccent: { color: colors.primary_green },
  description: { color: colors.text_muted, fontSize: 13, marginTop: 3 },
  scopeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 },
  sectionLabel: { color: colors.text_muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  card: { borderRadius: 18, borderWidth: 1, borderColor: colors.border_soft, backgroundColor: colors.surface, padding: 12, shadowColor: colors.secondary_green, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  labelIcon: { width: 27, height: 27, borderRadius: 9, backgroundColor: colors.surface_green, alignItems: "center", justifyContent: "center" },
  fieldTitle: { color: colors.text_strong, fontSize: 13, fontWeight: "700" },
  notesInput: { minHeight: 64, maxHeight: 90, borderWidth: 1, borderColor: colors.border_soft, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8, color: colors.text_strong, fontSize: 13, lineHeight: 18, backgroundColor: colors.surface_soft },
  characterCount: { alignSelf: "flex-end", color: colors.text_subtle, fontSize: 10, marginTop: 3 },
  suggestionHeader: { marginBottom: 8 },
  tags: { flexDirection: "row", flexWrap: "nowrap", gap: 6 },
  tag: { backgroundColor: colors.surface_blue, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  tagText: { color: colors.secondary_blue_deep, fontSize: 11, fontWeight: "600" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 },
  optional: { fontSize: 9, fontWeight: "700", color: colors.text_muted },
  pickerRow: { flexDirection: "row", gap: 9 },
  noResult: { color: colors.primary_red, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  actions: { flexDirection: "row", gap: 10 },
  searchButton: { flex: 1, minHeight: 48, backgroundColor: colors.secondary_green_deep, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  disabledButton: { backgroundColor: colors.primary_gray },
  searchButtonText: { color: colors.surface, fontWeight: "700", fontSize: 14 },
  cancelButton: { width: 90, minHeight: 48, borderRadius: 14, backgroundColor: colors.surface_red, alignItems: "center", justifyContent: "center" },
  cancelText: { color: colors.primary_red, fontWeight: "700", fontSize: 14 },
});
