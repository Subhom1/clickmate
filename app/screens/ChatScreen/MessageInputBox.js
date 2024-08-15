import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Image,
  Text,
  Keyboard,
  TouchableOpacity,
} from "react-native";

const MessageInputBox = ({addNewMessage }) => {
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
      />
    
          <View style={styles.sendBtnBox}>
            <TouchableOpacity onPress={sendMessage}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 15,
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent: 'space-between',
  },
  helper: {
    flexDirection: "row",
    marginTop: 10,
  },
  helperText1: {
    fontSize: 10,
    color: "#222",
  },
  helperText2: {
    fontSize: 10,
    color: "#222",
  },
  textInput: {
    fontSize: 14,
    color: "#222",
  },
  actionBox: {
    marginTop: 15,
    flexDirection: "row",
  },
  photos: {
    flexDirection: "row",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 30,
    marginLeft: -8,
  },
  online: {
    borderColor: "#3bcd6b",
    borderWidth: 2,
  },
  extraUsersNum: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
  extraUsersNumText: {
    color: "#fff",
    fontSize: 14,
  },
  addNewMember: {
    justifyContent: "center",
    alignItems: "center",
    color: "#222",
    backgroundColor: "#f4f4f4",
  },
  sendBtnBox: {
    height: 30,
    width: 50,
    borderLeftColor: "#d8d8d8",
    borderLeftWidth: 1,
    justifyContent:'center',
  },
  sendBtnText: {
    fontSize: 14,
    marginLeft: 15,
    color: "#222",
    justifyContent: 'center',
    alignItems:'center'
  },
});

export default MessageInputBox;
