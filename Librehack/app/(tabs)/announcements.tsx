import { View, StyleSheet, Text, ImageBackground, ScrollView, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from 'react';
 
//TOVA E NOTIFICATIONS
const backgroundpic = require("../../assets/images/back.png");
 
// izwestia koito shte se pokazwat ala oshte ne e gotovo za tva sega e fake data
const MOCK_DATA = [
  { id: 1, title: "Нов ъпдейт на приложението!", body: "Версия 2.0 вече е налична с много нови функции и подобрения.", time: "2 часа", read: false },
]
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(MOCK_DATA);
 
  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
 
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
 
  const unreadCount = notifications.filter(n => !n.read).length;
 
  return (
    <ImageBackground source={backgroundpic} style={styles.background}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Известия</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Маркирай всички</Text>
          </TouchableOpacity>
        )}
      </View>
 
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount} непрочетени</Text>
        </View>
      )}
 
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {notifications.map(n => (
          <TouchableOpacity
            key={n.id}
            style={[styles.card, !n.read && styles.cardUnread]}
            onPress={() => markAsRead(n.id)}
            activeOpacity={0.8}
          >
            {!n.read && <View style={styles.dot} />}
 
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, !n.read && styles.cardTitleUnread]}>
                {n.title}
              </Text>
              <Text style={styles.cardBody}>{n.body}</Text>
              <Text style={styles.cardTime}>{n.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
 
        <View style={{ height: 40 }} />
      </ScrollView>
    </ImageBackground>
  );
}
 
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 60,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0D4751",
    fontStyle: "italic",
  },
  markAll: {
    fontSize: 13,
    color: "#8B7EC8",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  badge: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 14,
    backgroundColor: "#0D4751",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0DA",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardUnread: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderColor: "#0D4751",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D4751",
    marginTop: 5,
    marginRight: 10,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },
  cardTitleUnread: {
    color: "#0D4751",
    fontWeight: "800",
  },
  cardBody: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    color: "#999",
  },
});
 