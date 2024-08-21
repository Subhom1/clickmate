import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Header from "./Header";
import MessageInputBox from "./MessageInputBox";
import MessagesList from "./MessagesList";
import io from "socket.io-client";
import { useRecoilState } from "recoil";
import axios from "axios";
import { userState } from "../../state/atoms/UserState";
import { matchState } from "../../state/atoms/MatchState";
import { chatState } from "../../state/atoms/ChatState";
import { IP } from "../../../constant";
import { useNavigation } from "@react-navigation/native";

const ChatScreen = ({ route }) => {
  const { platform } = route.params;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useRecoilState(chatState);
  const [userData, setUserData] = useRecoilState(userState);
  const [matchUser, setMatchUser] = useRecoilState(matchState);
  const [socket, setSocket] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    const newSocket = io(`http://${IP}:5051`, { reconnectionAttempts: 5 });
    // Initialize the socket connection when the component mounts
    setSocket(newSocket);
    newSocket.on("receiveMessage", (data) => {
      const newData = {
        ...data,
        from: data?.sender === userData?._id ? "2" : "1",
      };
      setMessages((prevItems) => [...prevItems, newData]);
    });
    if (!userData || !matchUser || !newSocket) return;
    console.log("Fetching chat for:", userData?._id, matchUser?.user?._id);
    const getChats = async () => {
      await axios
        .get(
          `http://${IP}:5051/chat/${userData?._id}/${matchUser?.user?._id}`
          // `http://${IP}:5051/chat/66aa146b3e816880bbb45baa/66a8f494514769344eb8bfcf`
        )

        .then((res) => {
          console.log(res?.data?._id, "fetch");
          setChatId(res?.data?._id);
          newSocket.emit("joinChat", { chatId: res?.data?._id });
          const msg = res?.data?.messages.map((item, index) => ({
            ...item,
            from: item?.sender === userData?._id ? "2" : "1",
          }));
          setMessages(msg);
        })
        .catch((e) => console.error(e, "fetch chat error"));
    };
    if (userData) getChats();
    return () => {
      newSocket.off("receiveMessage");
      newSocket.disconnect();
    };
  }, []);

  const sendMessge = (message) => {
    if (message === "") return;
    socket.emit("sendMessage", {
      chatId,
      message: {
        sender: userData?._id,
        content: message,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={platform == "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Header
          leftBtnAction={() => {
            socket.emit("leaveChat", { chatId });
            navigation.navigate('People');
          }}
          fullName={matchUser && matchUser?.user?.fullname}
          platform={platform}
        />

        <MessagesList
          messagesHistory={messages}
          fullName={matchUser && matchUser?.user?.fullname}
        />

        <View style={styles.bottom}>
          <MessageInputBox addNewMessage={(txt) => sendMessge(txt)} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  bottom: {
    justifyContent: "flex-end",
  },
});
export default ChatScreen;
