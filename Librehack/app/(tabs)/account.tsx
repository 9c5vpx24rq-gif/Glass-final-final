import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  Image,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backgroundpic = require("../../assets/images/account-background.png");
const logoutImg = require("../../assets/images/account-logout.png");
const deleteImg = require("../../assets/images/account-delete.png");

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const values = await AsyncStorage.multiGet(['userName', 'userEmail', 'userData']);
        const name = values[0][1] || '';
        const mail = values[1][1] || '';
        const userData = values[2][1] ? JSON.parse(values[2][1]) : null;
        // server returns full user row including password
        const pass = userData?.password || '';

        setUsername(name);
        setEmail(mail);
        setPassword(pass);
      } catch (e) {
        console.error('Грешка при зареждане на данни:', e);
      }
    };
    loadUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert("Изход", "Сигурни ли сте, че искате да излезете?", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Изход",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userData', 'userName', 'userEmail']);
          router.replace("../index-1");
        },
      },
    ]);
  };

const handleDeleteAccount = () => {
  Alert.alert("Изтрий акаунта", "Изтриването на акаунта е необратимо. Сигурни ли сте?", [
    { text: "Отказ", style: "cancel" },
    {
      text: "Изтрий",
      style: "destructive",
      onPress: async () => {
  console.log("Deleting user:", username); // add this
  try {
    const response = await fetch(
      `http://10.195.69.242:5000/app/deleteuser?username=${encodeURIComponent(username)}`,
      { method: "DELETE" }
    );
    const data = await response.json();
    console.log("Delete response:", data); // add this
  } catch (err) {
    console.error(err);
  }
  await AsyncStorage.multiRemove(['userToken', 'userData', 'userName', 'userEmail']);
  router.replace("../index-1");
},
    },
  ]);
};
  return (
    <ImageBackground source={backgroundpic} style={styles.back}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.container}>

        {/* ── Info card: Име + Имейл ── */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={32} color="#9B8EC4" style={styles.icon} />
            <View>
              <Text style={styles.label}>Име</Text>
              <Text style={styles.value}>{username || "—"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={32} color="#9B8EC4" style={styles.icon} />
            <View>
              <Text style={styles.label}>Имейл</Text>
              <Text style={styles.value}>{email || "—"}</Text>
            </View>
          </View>
        </View>

        {/* ── Info card: Парола ── */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.row}>
            <Ionicons name="lock-closed-outline" size={32} color="#9B8EC4" style={styles.icon} />
            <View>
              <Text style={styles.label}>Парола</Text>
              <Text style={styles.value}>{"•".repeat(password?.length || 4)}</Text>
            </View>
          </View>
        </View>

        {/* ── LOG OUT image button ── */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleLogout} style={styles.brushBtn}>
          <Image source={logoutImg} style={styles.logoutImage} resizeMode="contain" />
        </TouchableOpacity>

        {/* ── Delete account image button ── */}
        <Text style={styles.deleteWarning}>Изтриването на акаунта е необратимо.</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={handleDeleteAccount} style={styles.brushBtn}>
          <Image source={deleteImg} style={styles.deleteImage} resizeMode="contain" />
        </TouchableOpacity>

      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  back: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 230,
    paddingBottom: 50,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  icon: {
    marginRight: 16,
  },
  label: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 4,
  },
  brushBtn: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  logoutImage: {
    width: width - 48,
    height: 80,
  },
  deleteImage: {
    width: (width - 48) * 0.75,
    height: 64,
  },
  deleteWarning: {
    marginTop: 20,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
});