import MapView, { Marker } from 'react-native-maps';
import { Text, View, StyleSheet, Dimensions, TouchableOpacity, Image, Animated, PanResponder } from "react-native";
import React, { useRef, useState } from 'react';

const button_texture_1 = require('@/assets/images/povredeni.png');
const button_texture_2 = require('@/assets/images/nqmashti.png');

const citiesNoMed = require('../../data/cities-no-med.json');
const citiesMed = require('../../data/cities-med.json');

function getAllCoordinates(data) {
  const points = [];
  for (const oblast in data) {
    const cities = data[oblast];
    for (const cityName in cities) {
      const city = cities[cityName];
      if (city.coordinates) {
        points.push({
          id: `${oblast}-${cityName}`,
          name: cityName,
          oblast: oblast,
          latitude: city.coordinates.lat,
          longitude: city.coordinates.lng,
        });
      }
    }
  }
  return points;
}

const NO_MED_POINTS = getAllCoordinates(citiesNoMed);
const MED_POINTS = getAllCoordinates(citiesMed);

const PANEL_HEIGHT = 220;

export default function HomeScreen() {
  const map_ref = useRef(null);
  const [activeMarkers, setActiveMarkers] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const translateY = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  const BULGARIA_CENTER = {
    latitude: 42.6548,
    longitude: 26.9735,
    latitudeDelta: 4.0,
    longitudeDelta: 5.5,
  };

  const handleRegionChange = (region) => {
    const min_lat = 41.23;
    const max_lat = 44.25;
    const min_lng = 22.35;
    const max_lng = 28.65;

    if (
      region.latitude < min_lat ||
      region.latitude > max_lat ||
      region.longitude < min_lng ||
      region.longitude > max_lng
    ) {
      map_ref.current?.animateToRegion(BULGARIA_CENTER, 10);
    }
  };

  const openPanel = (point) => {
    console.log("Opening panel for:", point.name);
    setSelectedCity(point);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(translateY, {
      toValue: PANEL_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedCity(null));
  };
const handleVote = async () => {
  if (hasVoted) return;
  try {
    console.log("Voting for:", selectedCity.name);

    const response = await fetch("http://YOUR_IP:5000/app/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityName: selectedCity.name }),
    });

    const data = await response.json();
    console.log("Vote response:", data);

    if (data.success) {
      setHasVoted(true);
    } else {
      console.log("Failed:", data.message);
    }
  } catch (err) {
    console.log("Fetch error:", err.message);
  }
};

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          closePanel();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const currentPoints = activeMarkers === 'red'
    ? NO_MED_POINTS
    : activeMarkers === 'orange'
    ? MED_POINTS
    : [];

  const markerColor = activeMarkers === 'red'
    ? { outer: 'rgba(210, 40, 40, 0.35)', outerBorder: 'rgba(200, 30, 30, 0.7)', inner: 'rgba(200, 20, 20, 0.85)' }
    : { outer: 'rgba(255, 140, 0, 0.35)', outerBorder: 'rgba(220, 100, 0, 0.7)', inner: 'rgba(210, 90, 0, 0.85)' };

  return (
    <View style={styles.container}>
      <MapView
        ref={map_ref}
        style={styles.map}
        initialRegion={BULGARIA_CENTER}
        minZoomLevel={7}
        onRegionChangeComplete={handleRegionChange}
        onPress={closePanel}
      >
        {currentPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            tracksViewChanges={false}  // ← important for performance & touch
          >
            {/* ← TouchableOpacity INSIDE marker to fix press detection */}
            <TouchableOpacity onPress={() => openPanel(point)} activeOpacity={0.7}>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: markerColor.outer,
                borderWidth: 1.5, borderColor: markerColor.outerBorder,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: markerColor.inner,
                }} />
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

      {/* Bottom sheet panel */}
      {selectedCity && (
        <Animated.View
          style={[styles.panel, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle} />

          <Text style={styles.cityName}>{selectedCity.name}</Text>
          <Text style={styles.oblastName}>{selectedCity.oblast}</Text>

          <TouchableOpacity
            style={[styles.voteButton, hasVoted && styles.voteButtonDisabled]}
            onPress={handleVote}
            disabled={hasVoted}
          >
            <Text style={styles.voteButtonText}>
              {hasVoted ? '✓ Гласувано' : 'Гласувай'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={closePanel} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Затвори</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    borderRadius: 30,
  },
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
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 40, height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  cityName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  oblastName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  voteButton: {
    backgroundColor: '#e8353b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  voteButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  voteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#888',
    fontSize: 14,
  },
});