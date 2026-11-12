import { useEffect, useRef, useState } from "react";
import { Image, PixelRatio, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../../constant";
import { getProfilePhotoAuthToken } from "../profilePhoto/currentAuth";
import { initialAvatarSize, shouldUpgradeAvatar, targetAvatarSize } from "../profilePhoto/imageQuality";


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
  const layoutWidth = StyleSheet.flatten(styles.circle)?.width;
  const targetSize = targetAvatarSize(layoutWidth, PixelRatio.get());
  const firstSize = initialAvatarSize(targetSize);
  const [variantSize, setVariantSize] = useState(firstSize);
  const [imageFailed, setImageFailed] = useState(false);
  const [upgradeFailed, setUpgradeFailed] = useState(false);
  const loadStartedAt = useRef(0);
  const [token, setToken] = useState(null);
  useEffect(() => {
    let active = true;
    setToken(null);
    setVariantSize(firstSize);
    setImageFailed(false);
    setUpgradeFailed(false);
    if (protectedPhoto) {
      getProfilePhotoAuthToken()?.then(value => {
        if (active) setToken(value);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [protectedPhoto, resolvedUri, firstSize]);
  const sourceUri = protectedPhoto
    ? `${resolvedUri}${resolvedUri.includes("?") ? "&" : "?"}size=${variantSize}`
    : resolvedUri;
  const source = protectedPhoto
    ? token && !imageFailed && { uri: sourceUri, headers: { Authorization: `Bearer ${token}` } }
    : sourceUri && !imageFailed && { uri: sourceUri };
  return (
    <View style={[{ alignItems: "center", justifyContent: "center", backgroundColor: "#A7B0AD", overflow: "hidden" }, styles.circle, nav && { backgroundColor }]}>
      {source ? (
        <Image
          accessibilityLabel={`${name || "User"} profile photo`}
          source={source}
          resizeMode="cover"
          onLoadStart={() => { loadStartedAt.current = Date.now(); }}
          onLoad={() => {
            if (protectedPhoto && !upgradeFailed && shouldUpgradeAvatar(variantSize, targetSize, Date.now() - loadStartedAt.current)) {
              setVariantSize(targetSize);
            }
          }}
          onError={() => {
            if (protectedPhoto && variantSize > firstSize) {
              setUpgradeFailed(true);
              setVariantSize(firstSize);
            } else {
              setImageFailed(true);
            }
          }}
          style={{ width: "100%", height: "100%", borderRadius: 999 }}
        />
      ) : (
        <Text style={styles.initials}>{initials}</Text>
      )}
    </View>
  );
};

