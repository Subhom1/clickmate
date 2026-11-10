import { Image, Text, View } from "react-native";


const getInitials = (name) => {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase();
};
export const InitialsCircle = ({ name = "", styles = {}, focused, nav, photoUri }) => {
  const initials = getInitials(name);
  const backgroundColor = focused ? "#67AB0F" : "#A7B0AD";
  return (
    <View style={[{ alignItems: "center", justifyContent: "center", backgroundColor: "#A7B0AD", overflow: "hidden" }, styles.circle, nav && { backgroundColor }]}>
      {photoUri ? (
        <Image
          accessibilityLabel={`${name || "User"} profile photo`}
          source={{ uri: photoUri }}
          style={{ width: "100%", height: "100%", borderRadius: 999 }}
        />
      ) : (
        <Text style={styles.initials}>{initials}</Text>
      )}
    </View>
  );
};

