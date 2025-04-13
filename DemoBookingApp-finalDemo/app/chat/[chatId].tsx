import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { io } from "socket.io-client";
import Header from "@/components/Header";

// Types
type Message = {
  id: string;
  message_text: string;
  sender_id: string;
  timestamp: string;
};

const ChatDetail = () => {
  const { chatId, user } = useLocalSearchParams<{
    chatId: string;
    user: string;
  }>();

  const parsedUser = typeof user === "string" ? JSON.parse(user) : user;

  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMessagesLoaded, setIsMessagesLoaded] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const socket = useRef(io("http://10.0.2.2:3000")).current;

  if (!chatId || !parsedUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20, color: "red" }}>
          Error: Missing chatId or user information.
        </Text>
      </SafeAreaView>
    );
  }

  // ... phần còn lại giữ nguyên

  const fetchMessages = async () => {
    try {
      console.log("Fetching messages for chatId:", chatId);

      const response = await fetch(`http://10.0.2.2:3000/messages/${chatId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      console.log("Fetched messages:", data);
      setMessages(data);
      setIsMessagesLoaded(true);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setIsMessagesLoaded(true);
    }
  };

  useEffect(() => {
    console.log("chatId:", chatId);
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    if (!isMessagesLoaded) return;

    socket.emit("joinRoom", chatId);
    console.log("Joined room:", chatId);

    socket.on("message", (message: Message) => {
      console.log("Received new message:", message);
      setMessages((prevMessages) => {
        const existingMessageIndex = prevMessages.findIndex(
          (msg) =>
            msg.message_text === message.message_text &&
            msg.sender_id === message.sender_id
        );
        if (existingMessageIndex !== -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingMessageIndex] = message;
          return updatedMessages;
        }
        return [...prevMessages, message];
      });
    });

    socket.on("typing", ({ roomId, userId: typingUserId }) => {
      if (roomId === chatId && typingUserId !== userId) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", ({ roomId, userId: typingUserId }) => {
      if (roomId === chatId && typingUserId !== userId) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("message");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [isMessagesLoaded, chatId]);

  useEffect(() => {
    console.log("Current messages:", messages);
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim() === "") return;

    const message = {
      id: Date.now().toString(),
      sender_id: userId!,
      message_text: newMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prevMessages) => [...prevMessages, message]);
    console.log("Added message to state:", message);

    socket.emit("sendMessage", {
      roomId: chatId,
      message: { sender_id: userId!, message_text: newMessage },
    });
    setNewMessage("");
  };

  const handleTyping = () => {
    socket.emit("typing", { roomId: chatId, userId });
  };

  const handleStopTyping = () => {
    socket.emit("stopTyping", { roomId: chatId, userId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetail}
        options={{ headerShown: false }}
      />
      <Header title={user.name} showBackButton={true} />

      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            console.log("Rendering message:", item);
            return (
              <View
                style={[
                  styles.messageContainer,
                  item.sender_id === userId
                    ? styles.myMessage
                    : styles.otherMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.message_text}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            );
          }}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={true}
        />
        {isTyping && (
          <Text style={styles.typingIndicator}>User is typing...</Text>
        )}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              if (text) handleTyping();
              else handleStopTyping();
            }}
            placeholder="Type a message..."
            multiline
            scrollEnabled={true}
            textAlignVertical="center"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 18,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // Tạo hiệu ứng nổi trên Android
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
    textAlign: "right",
  },
  typingIndicator: {
    fontSize: 14,
    color: "#999",
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#F4F4F4",
    color: "#333",
    minHeight: 40,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#25D366",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatDetail;
