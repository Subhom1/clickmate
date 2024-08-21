import { Text, View } from "react-native";


const getInitials = (name) => {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
  return initials.toUpperCase();
};
export const InitialsCircle = ({ name, styles, focused, nav }) => {
  const initials = getInitials(name);
  const backgroundColor = focused ? "#67AB0F" : "#A7B0AD";
  return (
    <View style={[styles.circle, nav && { backgroundColor }]}>
      <Text style={styles.initials}>{initials}</Text>
    </View>
  );
};

