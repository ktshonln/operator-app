
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Typography } from './Typography';
import { Icon } from './Icon';
import { COLORS } from '../theme/colors';

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (
    latitude: number,
    longitude: number,
    address?: string,
  ) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

// Default to Kigali, Rwanda
const DEFAULT_LAT = -1.9441;
const DEFAULT_LNG = 30.0619;

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLatitude,
  initialLongitude,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Map Location Picker</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .leaflet-control-attribution { font-size: 10px !important; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            let marker;
            
            function initMap() {
                const initialLat = ${initialLatitude || DEFAULT_LAT};
                const initialLng = ${initialLongitude || DEFAULT_LNG};
                
                map = L.map('map').setView([initialLat, initialLng], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(map);
                
                // Add initial marker if coordinates provided
                if (${initialLatitude} && ${initialLongitude}) {
                    marker = L.marker([initialLat, initialLng]).addTo(map);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'locationSelected',
                        latitude: initialLat,
                        longitude: initialLng
                    }));
                }
                
                map.on('click', function(e) {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    
                    marker = L.marker([lat, lng]).addTo(map);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'locationSelected',
                        latitude: lat,
                        longitude: lng
                    }));
                });
                
                // Notify that map is ready
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapReady'
                }));
            }
            
            function moveToLocation(lat, lng) {
                if (map) {
                    map.setView([lat, lng], 15);
                    
                    if (marker) {
                        map.removeLayer(marker);
                    }
                    
                    marker = L.marker([lat, lng]).addTo(map);
                    
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'locationSelected',
                        latitude: lat,
                        longitude: lng
                    }));
                }
            }
            
            // Initialize map when page loads
            document.addEventListener('DOMContentLoaded', initMap);
        </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (visible) {
      requestLocationPermission();
      setMapReady(false);

      // Set initial location if provided
      if (initialLatitude && initialLongitude) {
        setSelectedLocation({
          latitude: initialLatitude,
          longitude: initialLongitude,
        });
      }
    }
  }, [visible, initialLatitude, initialLongitude]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required to get your current location.',
      );
      return;
    }

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      // Send location to WebView
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'moveToLocation',
          latitude: lat,
          longitude: lng,
        }),
      );
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Could not get your current location.');
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapReady':
          setMapReady(true);
          break;
        case 'locationSelected':
          setSelectedLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert(
        'No Location Selected',
        'Please tap on the map to select a location.',
      );
      return;
    }

    setLoading(true);
    try {
      // Simple address format with coordinates
      const address = `${selectedLocation.latitude.toFixed(
        6,
      )}, ${selectedLocation.longitude.toFixed(6)}`;
      onLocationSelect(
        selectedLocation.latitude,
        selectedLocation.longitude,
        address,
      );
      onClose();
    } catch (error) {
      console.error('Error with location selection:', error);
      onLocationSelect(selectedLocation.latitude, selectedLocation.longitude);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatCoordinate = (value: number, isLatitude: boolean) => {
    const direction = isLatitude
      ? value >= 0
        ? 'N'
        : 'S'
      : value >= 0
      ? 'E'
      : 'W';
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Icon name="x" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>
            Select Location
          </Typography>
          <TouchableOpacity
            onPress={handleConfirmLocation}
            style={[
              styles.confirmButton,
              !selectedLocation && styles.confirmButtonDisabled,
            ]}
            disabled={!selectedLocation || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Typography
                variant="body"
                color={COLORS.white}
                style={styles.confirmButtonText}
              >
                Confirm
              </Typography>
            )}
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {!mapReady && (
            <View style={styles.mapLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.brand} />
              <Typography
                variant="body"
                color={COLORS.textSecondary}
                style={styles.loadingText}
              >
                Loading map...
              </Typography>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />

          {/* Current Location Button */}
          {locationPermission && mapReady && (
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.brand} />
              ) : (
                <Icon name="navigation" size={20} color={COLORS.brand} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Coordinates Display */}
        <View style={styles.coordinatesContainer}>
          <View style={styles.instructionContainer}>
            <Icon name="info" size={16} color={COLORS.brand} />
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.instruction}
            >
              Tap anywhere on the map to select coordinates • Powered by
              OpenStreetMap
            </Typography>
          </View>

          {selectedLocation && (
            <View style={styles.coordinatesDisplay}>
              <Typography variant="body" style={styles.coordinatesTitle}>
                Selected Coordinates:
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Latitude: {formatCoordinate(selectedLocation.latitude, true)}
              </Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Longitude: {formatCoordinate(selectedLocation.longitude, false)}
              </Typography>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  confirmButtonText: {
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
  },
  webView: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  coordinatesContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  instruction: {
    flex: 1,
    lineHeight: 16,
  },
  coordinatesDisplay: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordinatesTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
});
