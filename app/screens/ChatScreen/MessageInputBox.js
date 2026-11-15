import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Pressable,
} from "react-native";

const MessageInputBox = ({ addNewMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    addNewMessage(newMessage);
    setNewMessage("");
  };

  return (
    <View style={styles.root}>
      <TextInput
        placeholder="Message..."
        style={styles.textInput}
        value={newMessage}
        onChangeText={(text) => setNewMessage(text)}
        className="flex-1 h-full"
      />

      <View style={styles.sendBtnBox} className='w-20'>
        <Pressable
          onPress={sendMessage}
          style={styles.sendButton}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 70,
    borderTopColor: "#ccc",
    borderTopWidth: 1,
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    paddingHorizontal: 10,
  },
  sendBtnBox: {
    justifyContent: "center",
    alignItems: "center",
    borderLeftColor: "#d8d8d8",
    borderLeftWidth: 1,
  },
  sendButton: {
    height: "100%", // Make the Pressable take up the full height
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: {
    fontSize: 14,
    color: "#222",
  },
});

export default MessageInputBox;
