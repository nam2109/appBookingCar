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
import { io, Socket } from "socket.io-client";
import Header from "@/components/Header";

// Types
type Message = {
  id: string;
  message_text: string;
  sender_id: string;
  timestamp: string;
  is_read?: boolean;
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

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io("http://10.0.2.2:3000");
    const socket = socketRef.current;

    // Connect and join room
    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
      socket.emit("joinRoom", chatId);
      console.log("Joined room:", chatId);
    });

    // Handle incoming messages
    socket.on("message", (message: Message) => {
      console.log("Received new message:", message);
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some((msg) => msg.id === message.id);
        if (messageExists) {
          console.log("Message already exists, skipping");
          return prevMessages;
        }
        const newMessages = [...prevMessages, message];
        console.log("Updated messages:", newMessages);
        return newMessages;
      });
    });

    // Handle typing indicators
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

    // Error handling
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Fetch initial messages
    fetchMessages();

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
      if (socket) {
        socket.off("connect");
        socket.off("message");
        socket.off("typing");
        socket.off("stopTyping");
        socket.off("connect_error");
        socket.disconnect();
      }
    };
  }, [chatId, userId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://10.0.2.2:3000/messages/${chatId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
      setIsMessagesLoaded(true);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setIsMessagesLoaded(true);
    }
  };

  const handleSend = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    const messageData = {
      roomId: chatId,
      message: {
        sender_id: userId!,
        message_text: newMessage,
      },
    };

    console.log("Sending message:", messageData);
    socketRef.current.emit("sendMessage", messageData);
    setNewMessage("");
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { roomId: chatId, userId });
    }
  };

  const handleStopTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit("stopTyping", { roomId: chatId, userId });
    }
  };

  // Rest of your render code remains the same
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetail}
        options={{ headerShown: false }}
      />
      <Header title={parsedUser.name} showBackButton={true} />

      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
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
              {item.sender_id === userId && item.is_read && (
                <Text style={styles.readIndicator}>✔</Text>
              )}
            </View>
          )}
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

// Your existing styles remain the same
export default ChatDetail;
