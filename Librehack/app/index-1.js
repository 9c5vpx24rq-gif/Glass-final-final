import {View , StyleSheet , Text, TextInput , ImageBackground} from "react-native";
import { router } from "expo-router";
import React, { Component } from 'react'
import { Button } from "@react-navigation/elements";
import AsyncStorage from '@react-native-async-storage/async-storage';
//TOVA E LOG IN
const backgroundpic = require("../assets/images/log-in-back.png");

export default function LoginScreen() {
    const [username , secusername ] = React.useState('');
    const [password , secpassword ] = React.useState('');

   const buttonsend = async () => {
  try {
    const response = await fetch(
      `http://10.195.69.242:5000/app/login?username=${username}&password=${password}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (data.success) {
      await AsyncStorage.setItem('userName', username);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      router.push("/(tabs)/map");
    } else {
      alert("Грешна парола/имейл");
    }
  } catch (err) {
    console.error("Опа стана нещо:", err.message);
  }
};

    return(
    <ImageBackground source={backgroundpic} style={styles.background}>
            <TextInput value={username}  onChangeText={secusername} style={styles.input} placeholderTextColor="#888" placeholder="Прякор"></TextInput>
            <TextInput value={password} onChangeText={secpassword} style={styles.input2} placeholderTextColor="#888" placeholder="Парола" secureTextEntry></TextInput>
            <Button onPressIn={buttonsend} style={styles.vhod}><Text style={styles.vhod1}>Вход</Text></Button>
            <Button style={styles.loginbut}  onPressIn={() => router.replace("/")}></Button>
    </ImageBackground>
    )
}

const styles = StyleSheet.create ({
  loginbut : {
    width: 200,
    position: "absolute",
    top: 700,
    alignSelf: "center",
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  vhod : {
    marginTop: 10,
    height: 70,
    color: "#fff",
    width: 300,
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#0D4751",
  },
vhod1 : {
  fontSize: 20,
  color: "#ffffff",
  position:"absolute",
  alignSelf: "center",
},
 input: {
    width: '100%',
    maxWidth: 340,
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginTop: 370,
    alignSelf: "center",
  },
  input2: {
    width: '100%',
    maxWidth: 340,
    height: 60,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    alignSelf: "center",
  },
})