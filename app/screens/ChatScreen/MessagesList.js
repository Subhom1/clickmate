import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Text, Keyboard, Pressable } from "react-native";
import { InitialsCircle } from "../../components/CreateAvatar";
import KeyboardDismissScrollView from "../../components/KeyboardDismissScrollView";

const MessagesList = ({ messagesHistory, fullName, avatarUrl, avatarFileId, onProfilePress }) => {
  const scrollViewRef = useRef();

  const goToBottomList = () => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", goToBottomList);
    return () => subscription.remove();
  }, []);

  return (
    <KeyboardDismissScrollView
      ref={scrollViewRef}
      style={{ flex: 1, paddingHorizontal: 15 }}
      contentContainerStyle={{ paddingBottom: 30 }}
      onContentSizeChange={goToBottomList}
    >
      {messagesHistory &&
        messagesHistory.map((message, index) => (
          <Message key={index} {...{ message }} fullName={fullName} avatarUrl={avatarUrl} avatarFileId={avatarFileId} onProfilePress={onProfilePress} />
        ))}
    </KeyboardDismissScrollView>
  );
};

const Message = ({ message, fullName, avatarUrl, avatarFileId, onProfilePress }) => {
  return (
    <View
      style={[
        styles.messageContainer,
        message.from === "2"
          ? { alignSelf: "flex-end" }
          : { alignSelf: "flex-start" },
      ]}
    >
      {message.from !== "2" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${fullName || "user"} profile`}
          disabled={!onProfilePress}
          onPress={onProfilePress}
        >
          <InitialsCircle name={fullName} photoUri={avatarUrl} avatarFileId={avatarFileId} styles={styles} />
        </Pressable>
      ) : null}
      <View
        style={[
          styles.messageBox,
          message.from === "2"
            ? { backgroundColor: "#e6e6e6", alignSelf: "flex-end" }
            : { backgroundColor: "#67AB0F", alignSelf: "flex-start" },
        ]}
      >
        <Text
          style={
            message.from === "2" ? styles.myMessageText : styles.messageText
          }
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  circle: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#67AB0F",
    marginRight: 10,
  },
  initials: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12
  },
  messageContainer: {
    flex: 1,
    maxWidth: "85%",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  messageBox: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 22,
  },
  messageText: {
    fontSize: 16,
    color: "#fff",
  },
  myMessageText: {
    fontSize: 16,
    color: "#222",
  },
});

export default MessagesList;
