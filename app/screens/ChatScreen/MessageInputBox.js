import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Keyboard,
  Pressable,
} from "react-native";

const MessageInputBox = ({ addNewMessage }) => {
  const [keyboardOpened, setKeyboardOpened] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    addNewMessage(newMessage);
    setNewMessage("");
  };

  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", () => setKeyboardOpened(true));
    Keyboard.addListener("keyboardWillHide", () => setKeyboardOpened(false));
    return () => {
      Keyboard.removeAllListeners("keyboardWillShow", () =>
        setKeyboardOpened(true)
      );
      Keyboard.removeAllListeners("keyboardWillHide", () =>
        setKeyboardOpened(false)
      );
    };
  }, []);

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
