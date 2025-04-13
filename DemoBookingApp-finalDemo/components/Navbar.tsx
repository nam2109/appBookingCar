import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation"; // Import đúng đường dẫn

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Navbar: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <View style={styles.activeTab}>
          <FontAwesome5 name="home" size={24} color="white" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
        <FontAwesome5 name="file-alt" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
        <FontAwesome5 name="comment" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
        <FontAwesome5 name="user" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 20,
    marginRight: 20,
    marginLeft: 20,
  },
  activeTab: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 100,
  },
});

export default Navbar;
