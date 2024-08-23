import React, { useRef, useEffect } from "react";
import { ScrollView, View, StyleSheet, Text, Keyboard, Image } from "react-native";
import { InitialsCircle } from "../../components/CreateAvatar";

const MessagesList = ({ messagesHistory, fullName }) => {
  const scrollViewRef = useRef();

  const goToBottomList = () => {
    scrollViewRef.current.scrollToEnd({ animated: false });
  };

  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", goToBottomList);
    return () => {
      Keyboard.removeAllListeners("keyboardDidShow", goToBottomList);
    };
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1, paddingHorizontal: 15 }}
      contentContainerStyle={{ paddingBottom: 30 }}
      onContentSizeChange={goToBottomList}
    >
      {messagesHistory &&
        messagesHistory.map((message, index) => (
          <Message key={index} {...{ message }} fullName={fullName} />
        ))}
    </ScrollView>
  );
};

const Message = ({ message, fullName }) => {
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
        <InitialsCircle name={fullName} styles={styles} />
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
    marginTop: 5,
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
