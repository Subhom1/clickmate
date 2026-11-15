import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSetAtom } from "jotai";
import axios from "axios";
import { API_BASE_URL } from "../../constant";
import { authenticatedHeaders } from "../network/auth";
import { userState } from "../state/atoms/UserState";

// Refresh friends when a screen opens so edits made on another device appear here.
export function useFreshFriends(userId, friendEmail) {
  const setUserData = useSetAtom(userState);
  const [refreshing, setRefreshing] = useState(Boolean(userId));
  const [refreshError, setRefreshError] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!userId || !API_BASE_URL) {
      setRefreshing(false);
      return;
    }
    let active = true;
    setRefreshing(true);
    setRefreshError(false);

    async function refreshFriends() {
      try {
        const headers = await authenticatedHeaders();
        const response = await axios.get(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/friends`, { headers });
        if (!Array.isArray(response.data)) throw new Error("Invalid friends response");
        if (active) {
          // A late response from a previous account must not replace the new account's friends.
          setUserData((current) => current?._id === userId
            ? { ...current, friends: response.data }
            : current);
        }
      } catch {
        if (active) setRefreshError(true);
      } finally {
        if (active) setRefreshing(false);
      }
    }

    refreshFriends();
    return () => { active = false; };
  }, [userId, friendEmail, setUserData]));

  return { refreshing, refreshError };
}
