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
import { useRecoilState, useSetRecoilState } from "recoil";
import axios from "axios";
import { userState } from "../../state/atoms/UserState";
import { matchState } from "../../state/atoms/MatchState";
import { chatState } from "../../state/atoms/ChatState";
import { IP } from "../../../constant";
import { useNavigation } from "@react-navigation/native";

const ChatScreen = ({ route }) => {
  const { platform, secondUserInfo } = route.params;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useRecoilState(chatState);
  const [userData, setUserData] = useRecoilState(userState);
  const [matchUser, setMatchUser] = useRecoilState(matchState);
  const setUserMongoData = useSetRecoilState(userState);
  const [socket, setSocket] = useState(null);
  const navigation = useNavigation();
  const secondUser = secondUserInfo ? secondUserInfo : matchUser?.user;

  console.log(matchUser, secondUserInfo, " second user info");
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
    if (!userData || !secondUser || !newSocket) return;
    console.log("Fetching chat for:", userData?._id, secondUser?._id);
    const getChats = async () => {
      await axios
        .get(`http://${IP}:5051/chat/${userData?._id}/${secondUser?._id}`)

        .then((res) => {
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
    getChats();
    return () => {
      newSocket.off("receiveMessage");
      newSocket.disconnect();
      if (userData?.email) {
        axios
          .get(`http://${IP}:5051/user/${userData?.email}`)
          .then((res) => {
            setUserMongoData(res.data);
          })
          .catch((e) => console.error(e, "Error message: mongodb user details"));
      }
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={platform == "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Header
          leftBtnAction={() => {
            socket.emit("leaveChat", { chatId });
            navigation.navigate("People");
          }}
          fullName={secondUser?.fullname}
          platform={platform}
        />

        <MessagesList
          messagesHistory={messages}
          fullName={secondUser?.fullname}
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
