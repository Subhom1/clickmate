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
import Toast from "react-native-root-toast";
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

  useEffect(() => {
    const newSocket = io(`http://${IP}:5051`, { reconnectionAttempts: 5 });
    setSocket(newSocket);
    newSocket.on("receiveMessage", (data) => {
      const newData = {
        ...data,
        from: data?.sender === userData?._id ? "2" : "1",
      };
      setMessages((prevItems) => [...prevItems, newData]);
      // Automatically mark the message as read
      newSocket.emit("markAsRead", {
        chatId,
        userId: userData?._id,
      });
    });
    if (!userData || !secondUser) return;
    const getChats = async () => {
      await axios
        .get(`http://${IP}:5051/chat/${userData?._id}/${secondUser?._id}`)
        .then((res) => {
          setChatId(res?.data?._id);
          newSocket.emit("joinChat", { chatId: res?.data?._id });
          const msg = res?.data?.messages.map((item) => ({
            ...item,
            from: item?.sender === userData?._id ? "2" : "1",
          }));
          setMessages(msg);

          // Mark all messages as read when joining the chat
          newSocket.emit("markAsRead", {
            chatId: res?.data?._id,
            userId: userData?._id,
          });
        })
        .catch((e) => console.error(e, "fetch chat error"));
    };
    getChats();
    newSocket.on("messagesCleared", () => {
      // Add a Toast on screen.
      let toast = Toast.show("All chats cleared", {
        duration: Toast.durations.LONG,
        shadow: false,
        position: 0,
        opacity: 0.6
      });
      // You can manually hide the Toast, or it will automatically disappear after a `duration` ms timeout.
      setTimeout(() => {
        Toast.hide(toast);
      }, 5000);
      getChats()
    });
    return () => {
      const getUserInfo = async () => {
        await axios
          .get(`http://${IP}:5051/user/${userData?.email}`)
          .then((res) => {
            setUserMongoData(res.data);
          })
          .catch((e) =>
            console.error(e, "Error message: mongodb user details")
          );
      };
      
      if (!secondUserInfo) {
        getUserInfo();
      }
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
  const clearMessage = () => {
    socket.emit("clearMessages", { chatId });
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
          rightBtnAction={() => {
            clearMessage();
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
