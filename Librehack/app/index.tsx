import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
const backgroundpic = require("../assets/images/sign-in-back.png");
import { Button } from "@react-navigation/elements";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });

  const validateName = (v: string) => {
    if (!v.trim()) return 'Името е задължително';
    return '';
  };

  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Имейлът е задължителен';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Невалиден имейл';
    return '';
  };

  const validatePassword = (v: string) => {
    if (!v) return 'Паролата е задължителна';
    if (v.length < 6) return 'Минимум 6 символа';
    return '';
  };

  const onChange = (field: 'name' | 'email' | 'password', text: string) => {
    if (field === 'name') setName(text);
    if (field === 'email') setEmail(text);
    if (field === 'password') setPassword(text);
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const handleRegister = async () => {
    if (loading) return;

    const e = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };

    if (e.name || e.email || e.password) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://10.195.69.242:5000/app/register?username=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(email.trim().toLowerCase())}&password=${encodeURIComponent(password)}`,
        { method: 'GET' },
      );

      const data = await response.json();

      if (data.success) {
      Alert.alert('Успех', 'Профилът е създаден!', [
        { text: 'Вход', onPress: () => router.replace('/(tabs)/map') }
      ]);
      setName(''); setEmail(''); setPassword('');
    } else {
        Alert.alert('Грешка', data.message || 'Грешка при регистрация.');
      }

    } catch (error: unknown) {
      Alert.alert('Грешка', error instanceof Error ? error.message : 'Няма връзка.');
    } finally {
      setLoading(false);
    }
  };


  
  return (
    <View style={styles.container}>
      <ImageBackground source={backgroundpic} style={styles.background}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <TextInput
            value={name}
            onChangeText={t => onChange('name', t)}
            style={styles.input}
            placeholderTextColor="#888"
            placeholder="Име"
            autoCapitalize="words"
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          <TextInput
            value={email}
            onChangeText={t => onChange('email', t)}
            style={styles.input2}
            placeholderTextColor="#888"
            placeholder="Имейл"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <TextInput
            value={password}
            onChangeText={t => onChange('password', t)}
            style={styles.input2}
            placeholderTextColor="#888"
            placeholder="Парола"
            secureTextEntry
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          <TouchableOpacity onPress={handleRegister} style={styles.button} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Регистриране</Text>}
          </TouchableOpacity>

        </ScrollView>
        <Button onPressIn={() => router.replace("../index-1")} style={styles.testing}>Вход</Button>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  testing: {
    color: "#000000",
    height: 50,
    width: 50,
    position: "absolute",
    top: 740,
    right: 110,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    alignItems: 'center',
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
    marginTop: 380,
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
  },
  button: {
    marginTop: 24,
    width: '100%',
    maxWidth: 340,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#0D4751',
  },
  buttonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 340,
  },
});