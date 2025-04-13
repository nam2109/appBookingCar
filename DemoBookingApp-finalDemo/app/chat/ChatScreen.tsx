// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router"; // thêm dòng này ở đầu file

import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types/navigation";
import { io } from "socket.io-client";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import { Platform } from "react-native"; // Import Platform để kiểm tra môi trường
import { Stack } from "expo-router";

type ChatRoom = {
  id: number;
  user_id: string;
  driver_id: string;
  otherUser: { id: string; name: string; profileImageUrl: string };
  lastMessage: string;
  unreadCount: number;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Chat">;

const ChatScreen: React.FC = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const navigation = useNavigation<NavigationProp>();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const socket = useRef(io("http://10.0.2.2:3000")).current;

  const fetchChatRooms = async () => {
    try {
      const response = await fetch(`http://10.0.2.2:3000/chat-rooms/${userId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch chat rooms");
      }
      const data = await response.json();
      console.log("Fetched chat rooms:", data);
      setChatRooms(data);
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    // Lắng nghe sự kiện updateUnreadCount từ Socket.IO
    socket.on("updateUnreadCount", ({ roomId, lastMessage, unreadCount }) => {
      console.log(
        `Received updateUnreadCount for room ${roomId}: ${unreadCount}`
      );
      setChatRooms((prevChatRooms) =>
        prevChatRooms.map((room) =>
          room.id.toString() === roomId ? { ...room, unreadCount } : room
        )
      );
    });

    // Dọn dẹp khi component unmount
    return () => {
      socket.off("updateUnreadCount");
    };
  }, []);

  const handleChatPress = (room: ChatRoom) => {
    const markMessagesAsRead = async () => {
      try {
        await fetch(`http://10.0.2.2:3000/mark-read/${room.id}/${userId}`, {
          method: "POST",
        });
        setChatRooms((prevChatRooms) =>
          prevChatRooms.map((r) =>
            r.id === room.id ? { ...r, unreadCount: 0 } : r
          )
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
    // 👉 điều hướng bằng expo-router
    router.push({
      pathname: `/chat/${room.id}`,
      params: { user: JSON.stringify(room.otherUser) }, // user sẽ được parse lại trong trang chi tiết
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Header title="Chat List" showBackButton={true} />

      {chatRooms.length === 0 ? (
        <Text style={styles.noChatsText}>No chat rooms available.</Text>
      ) : (
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => handleChatPress(item)}
            >
              {item.otherUser.profileImageUrl ? (
                <Image
                  source={{ uri: item.otherUser.profileImageUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <Text style={styles.avatarText}>
                    {item.otherUser.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>{item.otherUser.name}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
      <Navbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  noChatsText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Hiệu ứng nổi trên Android
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  defaultAvatar: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 14,
    minWidth: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ChatScreen;
//
