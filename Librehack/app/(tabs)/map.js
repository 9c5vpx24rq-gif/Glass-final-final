import MapView, { Marker } from 'react-native-maps';
import {
  Text, View, StyleSheet, Dimensions, TouchableOpacity, Image,
  Animated, PanResponder, DeviceEventEmitter, TextInput, Keyboard,
} from "react-native";
import React, { useRef, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground } from 'react-native';

const backgroundpic = require('../../assets/images/image.png');
const button_texture_1 = require('@/assets/images/povredeni.png');
const button_texture_2 = require('@/assets/images/nqmashti.png');
const citiesNoMed = require('../../data/cities-no-med.json');
const citiesMed = require('../../data/cities-med.json');
const schoolsBurgas = require('../../data/schools-burgas.json');

const PANEL_HEIGHT = 400;
const BULGARIA_CENTER = {
  latitude: 42.73,
  longitude: 25.48,
  latitudeDelta: 3.8,
  longitudeDelta: 5.2,
};

const BULGARIA_BOUNDS = {
  minLat: 40.0,
  maxLat: 45.5,
  minLng: 21.0,
  maxLng: 30.0,
};

function getAllCoordinates(data) {
  const points = [];
  for (const oblast in data) {
    for (const townName in data[oblast]) {
      const town = data[oblast][townName];
      if (town.coordinates) {
        points.push({
          id: townName,
          name: townName,
          oblast,
          latitude: town.coordinates.lat,
          longitude: town.coordinates.lng,
        });
      }
    }
  }
  return points;
}

function getAllSchoolCoordinates(data) {
  const points = [];
  for (const oblast in data) {
    for (const townName in data[oblast]) {
      const town = data[oblast][townName];
      for (const school of town.училища ?? []) {
        if (school.coordinates) {
          points.push({
            id: `${townName}-${school.name}`,
            name: school.name,
            oblast,
            latitude: school.coordinates.lat,
            longitude: school.coordinates.lng,
            information: school.information,
          });
        }
      }
    }
  }
  return points;
}

const NO_MED_POINTS = getAllCoordinates(citiesNoMed);
const MED_POINTS = getAllCoordinates(citiesMed);
const SCHOOL_POINTS = getAllSchoolCoordinates(schoolsBurgas);
const ALL_POINTS = [...NO_MED_POINTS, ...MED_POINTS, ...SCHOOL_POINTS];

const MARKER_COLORS = {
  red:     { outer: 'rgba(210,40,40,0.35)',  outerBorder: 'rgba(200,30,30,0.7)',  inner: 'rgba(200,20,20,0.85)' },
  orange:  { outer: 'rgba(255,140,0,0.35)',  outerBorder: 'rgba(220,100,0,0.7)', inner: 'rgba(210,90,0,0.85)'  },
  schools: { outer: 'rgba(255,140,0,0.35)',  outerBorder: 'rgba(220,100,0,0.7)', inner: 'rgba(210,90,0,0.85)'  },
};

const POINTS_BY_MODE = {
  red: NO_MED_POINTS,
  orange: MED_POINTS,
  schools: SCHOOL_POINTS,
};

export default function HomeScreen() {
  const map_ref = useRef(null);
  const [activeMarkers, setActiveMarkers] = useState(null);

  const [region, setRegion] = useState(BULGARIA_CENTER);

  const [selectedCity, setSelectedCity] = useState(null);
  const [votedOrange, setVotedOrange] = useState(false);
  const [votedRed, setVotedRed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const drawerX = useRef(new Animated.Value(300)).current;
  const isDrawerOpenRef = useRef(false);

  const [reportLocation, setReportLocation] = useState(null);
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const reportTranslateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  // ─── Drawer ────────────────────────────────────────────────────────────────
  const toggleDrawer = () => {
    if (isDrawerOpenRef.current) {
      Animated.timing(drawerX, { toValue: 300, duration: 300, useNativeDriver: true })
        .start(() => { setDrawerOpen(false); isDrawerOpenRef.current = false; });
    } else {
      setDrawerOpen(true);
      isDrawerOpenRef.current = true;
      setTimeout(() => {
        Animated.spring(drawerX, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      }, 10);
    }
  };

  // ─── City panel ────────────────────────────────────────────────────────────
  const openPanel = (point) => {
    Keyboard.dismiss();
    const mode = activeMarkers === 'schools' ? 'schools' : 'hospitals';
    setSelectedCity({
      name: point.name,
      oblast: point.oblast ?? 'Бургаска Област',
      information: point.information,
      mode,
    });
    setVotedOrange(false);
    setVotedRed(false);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closePanel = () => {
    Animated.timing(translateY, { toValue: PANEL_HEIGHT, duration: 300, useNativeDriver: true })
      .start(() => setSelectedCity(null));
  };

  // ─── Vote ─────────────────────────────────────────────────────────────────
  const handleVote = async (button) => {
    if (button === 'orange' && votedOrange) return;
    if (button === 'red' && votedRed) return;
    try {
      // In handleVote, before the fetch:
console.log("Sending vote:", {
  cityName: selectedCity.name,
  mode: selectedCity.mode,
  button,
});
      const response = await fetch("http://192.168.1.39:5000/app/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: selectedCity.name,
          mode: selectedCity.mode,
          button,
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (button === 'orange') setVotedOrange(true);
        else setVotedRed(true);
      } else {
        console.log("Vote failed:", data.message);
      }
    } catch (err) {
      console.log("Vote error:", err.message);
    }
  };

  // ─── Report panel ──────────────────────────────────────────────────────────
  const openReportPanel = (coordinate) => {
    if (selectedCity) closePanel();
    setReportLocation(coordinate);
    setReportText('');
    setReportSent(false);
    Animated.spring(reportTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeReportPanel = () => {
    Keyboard.dismiss();
    Animated.timing(reportTranslateY, { toValue: PANEL_HEIGHT, duration: 300, useNativeDriver: true })
      .start(() => setReportLocation(null));
  };

  const handleReport = async () => {
    if (reportSent || !reportText.trim()) return;
    try {
      const response = await fetch("http://192.168.1.39:5000/app/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: reportLocation.latitude,
          longitude: reportLocation.longitude,
          reason: reportText,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReportSent(true);
        setTimeout(closeReportPanel, 1500);
      } else {
        console.log("Report failed:", data.message);
      }
    } catch (err) {
      console.log("Report error:", err.message);
    }
  };

  // ─── Map press ─────────────────────────────────────────────────────────────
  const handleMapPress = () => {
    Keyboard.dismiss();
    closePanel();
    closeReportPanel();
  };

  // ─── Listeners ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const drawerSub = DeviceEventEmitter.addListener('openDrawer', toggleDrawer);
    const searchSub = DeviceEventEmitter.addListener('search', (text) => {
      if (!text.trim()) return;
      const match = ALL_POINTS.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
      if (match) {
        map_ref.current?.animateToRegion({
          latitude: match.latitude,
          longitude: match.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 600);
      }
    });
    return () => { drawerSub.remove(); searchSub.remove(); };
  }, []);

  // ─── Bounds check ──────────────────────────────────────────────────────────
  const clampRegion = (r) => {
    const clampedLat = Math.max(
      BULGARIA_BOUNDS.minLat + r.latitudeDelta / 2,
      Math.min(BULGARIA_BOUNDS.maxLat - r.latitudeDelta / 2, r.latitude)
    );
    const clampedLng = Math.max(
      BULGARIA_BOUNDS.minLng + r.longitudeDelta / 2,
      Math.min(BULGARIA_BOUNDS.maxLng - r.longitudeDelta / 2, r.longitude)
    );
    setRegion({ ...r, latitude: clampedLat, longitude: clampedLng });
  };

  // ─── Swipe-to-close for city panel ────────────────────────────────────────
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
    onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) closePanel();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  const currentPoints = POINTS_BY_MODE[activeMarkers] ?? [];
  const markerColor = MARKER_COLORS[activeMarkers] ?? MARKER_COLORS.orange;

  return (
    <View style={styles.container}>
      <MapView
        ref={map_ref}
        style={styles.map}
        region={region}
        minZoomLevel={7}
        onRegionChange={clampRegion}
        onPress={handleMapPress}
        onLongPress={(e) => openReportPanel(e.nativeEvent.coordinate)}
      >
        {currentPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            tracksViewChanges={false}
          >
            <TouchableOpacity onPress={() => openPanel(point)} activeOpacity={0.7}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: markerColor.outer, borderWidth: 1.5, borderColor: markerColor.outerBorder, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: markerColor.inner }} />
              </View>
            </TouchableOpacity>
          </Marker>
        ))}
      </MapView>

      {/* Top buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.textureButton} onPress={() => setActiveMarkers('orange')}>
          <Image source={button_texture_1} style={styles.textureImage} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.textureButton} onPress={() => setActiveMarkers('red')}>
          <Image source={button_texture_2} style={styles.textureImage} />
        </TouchableOpacity>
      </View>

      {/* City panel */}
      {selectedCity && (
        <Animated.View style={[styles.panel, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
          <ImageBackground source={backgroundpic} style={styles.backgroundpic}>
            <Text style={styles.schoolname}>{selectedCity.name}</Text>
            <Text style={styles.oblastName}>{selectedCity.oblast}</Text>
            <Text style={styles.information}>{selectedCity.information}</Text>

            {/* Vote buttons — only show when a marker mode is active */}
                {selectedCity && (
      <TouchableOpacity
  style={[styles.brownVoteBtn, votedOrange && { backgroundColor: '#3a1a0a' }]}
  onPress={() => handleVote('orange')}
  disabled={votedOrange}
>
  <Text style={styles.brownVoteBtnText}>
    {votedOrange ? '✓ Гласувано' : 'Гласувай'}
  </Text>
</TouchableOpacity>
)}

            <TouchableOpacity onPress={closePanel} style={styles.closeButton} />
          </ImageBackground>
        </Animated.View>
      )}

      {/* Report panel */}
      {reportLocation && (
        <Animated.View style={[styles.panel, { transform: [{ translateY: reportTranslateY }] }]}>
          <View style={styles.reportPanelInner}>
            <Text style={styles.reportTitle}>Докладвай проблем</Text>
            <TextInput
              style={styles.reportInput}
              placeholder="Опиши проблема..."
              placeholderTextColor="#888"
              multiline
              value={reportText}
              onChangeText={setReportText}
            />
            <TouchableOpacity
              style={[styles.reportButton, (reportSent || !reportText.trim()) && styles.buttonDisabled]}
              onPress={handleReport}
              disabled={reportSent || !reportText.trim()}
            >
              <Text style={styles.reportButtonText}>
                {reportSent ? 'Изпратено ✓' : 'Докладвай'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={closeReportPanel}>
              <Text style={styles.cancelButtonText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={toggleDrawer} activeOpacity={1} />
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
            <Text style={styles.drawerTitle}>Категории</Text>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setActiveMarkers('orange'); toggleDrawer(); }}>
              <Text style={styles.drawerItemText}><Ionicons name="medkit-outline" /> Болници</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setActiveMarkers('schools'); toggleDrawer(); }}>
              <Text style={styles.drawerItemText}><Ionicons name="school-outline" /> Училища</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setActiveMarkers(null); toggleDrawer(); }}>
              <Text style={styles.drawerItemText}>Изчисти</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  brownVoteBtn: {
  position: 'absolute',
  bottom: 40,
  left: 20,
  width: 100,
  height: 100,
  borderRadius: 12,
  backgroundColor: '#6B3A2A',
  alignItems: 'center',
  justifyContent: 'center',
},
brownVoteBtnText: {
  color: 'white',
  fontWeight: '700',
  fontSize: 15,
  textAlign: 'center',
},
  container: { flex: 1 },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },

  // ─── Top buttons ───────────────────────────────────────────────────────────
  buttonContainer: {
    position: 'absolute',
    top: 50, left: 40, right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textureButton: {
    width: 120, height: 50,
    backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center',
  },
  textureImage: { width: '150%', height: '150%', resizeMode: 'contain' },

  // ─── Shared panel ──────────────────────────────────────────────────────────
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
  },
  backgroundpic: { flex: 1, width: '100%', height: '100%' },

  // ─── City panel ────────────────────────────────────────────────────────────
  schoolname: {
    fontSize: 12,
    color: '#020000',
    position: 'absolute',
    bottom: '30%',
    left: 200,
  },
  oblastName: {
    fontSize: 12,
    color: '#020000',
    position: 'absolute',
    bottom: '30%',
    left: 100,
  },
  information: {
    color: '#000000',
    position: 'absolute',
    top: 320,
    width: '80%',
    alignSelf: 'flex-end',
    padding: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 90, left: 60,
    width: 70, height: 70,
    borderRadius: 10,
  },
  voteButtonRow: {
    position: 'absolute',
    bottom: 40,
    left: 20, right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  voteBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  voteBtnOrange: { backgroundColor: '#e07820' },
  voteBtnRed:    { backgroundColor: '#e05c5c' },
  voteBtnText:   { color: 'white', fontWeight: '600', fontSize: 15 },

  // ─── Report panel ──────────────────────────────────────────────────────────
  reportPanelInner: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    alignSelf: 'center',
    marginBottom: 16,
  },
  reportInput: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 12,
    height: 140,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
  },
  reportButton: {
    backgroundColor: '#e05c5c',
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#888',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },

  // ─── Drawer ────────────────────────────────────────────────────────────────
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: 260,
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  drawerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#333',
  },
});