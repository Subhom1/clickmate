import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { API_BASE_URL } from "../../constant";
import { getProfilePhotoAuthToken } from "../profilePhoto/currentAuth";


const getInitials = (name) => {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase();
};
export const InitialsCircle = ({ name = "", styles = {}, focused, nav, photoUri, avatarFileId }) => {
  const initials = getInitials(name);
  const backgroundColor = focused ? "#67AB0F" : "#A7B0AD";
  const resolvedUri = photoUri || (avatarFileId && API_BASE_URL ? `${API_BASE_URL}/v1/avatar-files/${encodeURIComponent(avatarFileId)}` : null);
  const protectedPhoto = Boolean(API_BASE_URL && resolvedUri?.startsWith(`${API_BASE_URL}/v1/avatar-files/`));
  const [token, setToken] = useState(null);
  useEffect(() => {
    let active = true;
    setToken(null);
    if (protectedPhoto) {
      getProfilePhotoAuthToken()?.then(value => {
        if (active) setToken(value);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [protectedPhoto, resolvedUri]);
  const source = protectedPhoto
    ? token && { uri: resolvedUri, headers: { Authorization: `Bearer ${token}` } }
    : resolvedUri && { uri: resolvedUri };
  return (
    <View style={[{ alignItems: "center", justifyContent: "center", backgroundColor: "#A7B0AD", overflow: "hidden" }, styles.circle, nav && { backgroundColor }]}>
      {source ? (
        <Image
          accessibilityLabel={`${name || "User"} profile photo`}
          source={source}
          style={{ width: "100%", height: "100%", borderRadius: 999 }}
        />
      ) : (
        <Text style={styles.initials}>{initials}</Text>
      )}
    </View>
  );
};

