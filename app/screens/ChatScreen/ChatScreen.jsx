import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Header from "./Header";
import MessageInputBox from "./MessageInputBox";
import MessagesList from "./MessagesList";
import { createAuthenticatedSocket } from "../../network/socket";
import { authenticatedHeaders } from "../../network/auth";
import { useAtom, useSetAtom } from "jotai";
import axios from "axios";
import { userState } from "../../state/atoms/UserState";
import { matchState } from "../../state/atoms/MatchState";
import { chatState } from "../../state/atoms/ChatState";
import { API_BASE_URL } from "../../../constant";
import { useNavigation } from "@react-navigation/native";
const ChatScreen = ({ route }) => {
  const { platform, secondUserInfo } = route.params;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useAtom(chatState);
  const [userData, setUserData] = useAtom(userState);
  const [matchUser, setMatchUser] = useAtom(matchState);
  const setUserMongoData = useSetAtom(userState);
  const [socket, setSocket] = useState(null);
  const [showClearNotice, setShowClearNotice] = useState(false);
  const clearNoticeTimer = useRef(null);
  const navigation = useNavigation();
  const secondUser = secondUserInfo ? secondUserInfo : matchUser?.user;

  useEffect(() => {
    const newSocket = createAuthenticatedSocket();
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
      try {
        const headers = await authenticatedHeaders();
        const res = await axios.get(
          `${API_BASE_URL}/chat/${userData._id}/${secondUser._id}`,
          { headers }
        );
        setChatId(res?.data?._id);
        newSocket.emit("joinChat", { chatId: res?.data?._id });
        const msg = res?.data?.messages.map((item) => ({
          ...item,
          from: item?.sender === userData?._id ? "2" : "1",
        }));
        setMessages(msg);
        newSocket.emit("markAsRead", {
          chatId: res?.data?._id,
          userId: userData?._id,
        });
      } catch (error) {
        console.error(error, "fetch chat error");
      }
    };
    getChats();
    newSocket.on("messagesCleared", () => {
      setShowClearNotice(true);
      if (clearNoticeTimer.current) clearTimeout(clearNoticeTimer.current);
      clearNoticeTimer.current = setTimeout(() => setShowClearNotice(false), 3500);
      getChats();
    });
    return () => {
      if (clearNoticeTimer.current) clearTimeout(clearNoticeTimer.current);
      const getUserInfo = async () => {
        try {
          const headers = await authenticatedHeaders();
          const res = await axios.get(`${API_BASE_URL}/user/${userData?.email}`, { headers });
          setUserMongoData(res.data);
        } catch (error) {
          console.error(error, "Error message: mongodb user details");
        }
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
            navigation.navigate("Tab", {
              screen: "People",
              params: { platform },
            });
          }}
          rightBtnAction={() => {
            clearMessage();
          }}
          fullName={secondUser?.fullname}
          platform={platform}
        />
        <MessagesList
          avatarUrl={secondUser?.avatarUrl}
          avatarFileId={secondUser?.avatarFileId}
          messagesHistory={messages}
          fullName={secondUser?.fullname}
        />
        <View style={styles.bottom}>
          <MessageInputBox addNewMessage={(txt) => sendMessge(txt)} />
        </View>
      </KeyboardAvoidingView>
      {showClearNotice && (
        <View style={styles.clearNotice} pointerEvents="none">
          <Text style={styles.clearNoticeText}>All chats cleared</Text>
        </View>
      )}
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
  clearNotice: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  clearNoticeText: {
    color: "#fff",
    fontSize: 16,
  },
});
export default ChatScreen;
