import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { MapLocationPicker } from '../components/MapLocationPicker';
import { COLORS } from '../theme/colors';
import { Location } from '../mock/transportData';

export const LocationDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const loc: Location = route.params?.location;

  const [name, setName] = useState(loc.name);
  const [province, setProvince] = useState(loc.province);
  const [lat, setLat] = useState(String(loc.lat));
  const [lng, setLng] = useState(String(loc.lng));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Location Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .leaflet-control-attribution { font-size: 8px !important; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            let map;
            
            function initMap() {
                const lat = ${parseFloat(lat) || loc.lat};
                const lng = ${parseFloat(lng) || loc.lng};
                
                map = L.map('map').setView([lat, lng], 15);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap',
                    maxZoom: 19
                }).addTo(map);
                
                // Add marker for the location
                L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup('${name}<br>Lat: ${lat}, Lng: ${lng}')
                    .openPopup();
            }
            
            // Initialize map when page loads
            document.addEventListener('DOMContentLoaded', initMap);
        </script>
    </body>
    </html>
  `;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert(
        'Validation',
        'Latitude and longitude must be valid numbers.',
      );
      return;
    }

    // Validate coordinate ranges
    if (latNum < -90 || latNum > 90) {
      Alert.alert('Validation', 'Latitude must be between -90 and 90 degrees.');
      return;
    }
    if (lngNum < -180 || lngNum > 180) {
      Alert.alert(
        'Validation',
        'Longitude must be between -180 and 180 degrees.',
      );
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
      Alert.alert('Saved', 'Location updated successfully.');
    }, 600);
  };

  const handleLocationSelect = (latitude: number, longitude: number) => {
    setLat(latitude.toFixed(6));
    setLng(longitude.toFixed(6));
  };

  const getCurrentCoordinates = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return {
      latitude: !isNaN(latNum) ? latNum : loc.lat,
      longitude: !isNaN(lngNum) ? lngNum : loc.lng,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={loc.name}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon={editing ? 'check' : 'edit'}
        onRightPress={() => (editing ? handleSave() : setEditing(true))}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Interactive Map */}
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: mapHtml }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />

          {editing && (
            <TouchableOpacity
              style={styles.editMapButton}
              onPress={() => setShowMapPicker(true)}
            >
              <Icon name="edit" size={16} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            editable={editing}
          />
          <Field
            label="Province"
            value={province}
            onChangeText={setProvince}
            editable={editing}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label="Latitude"
                value={lat}
                onChangeText={setLat}
                editable={editing}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.half, { marginLeft: 12 }]}>
              <Field
                label="Longitude"
                value={lng}
                onChangeText={setLng}
                editable={editing}
                keyboardType="numeric"
              />
            </View>
          </View>

          {editing && (
            <View style={styles.helpContainer}>
              <Icon name="info" size={14} color={COLORS.brand} />
              <Typography
                variant="caption"
                color={COLORS.textSecondary}
                style={styles.helpText}
              >
                Tap the edit button on the map above to select new coordinates
                interactively
              </Typography>
            </View>
          )}

          <View style={styles.metaRow}>
            <Typography variant="caption" color={COLORS.textMuted}>
              Created: {new Date(loc.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color={COLORS.textMuted}>
              Updated: {new Date(loc.updated_at).toLocaleDateString()}
            </Typography>
          </View>
        </View>

        {editing && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Typography
              variant="body"
              color={COLORS.white}
              style={{ fontWeight: '700' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Typography>
          </TouchableOpacity>
        )}
      </ScrollView>

      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLatitude={getCurrentCoordinates().latitude}
        initialLongitude={getCurrentCoordinates().longitude}
      />
    </SafeAreaView>
  );
};

const Field = ({ label, value, onChangeText, editable, keyboardType }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Typography
      variant="caption"
      style={{
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontSize: 11,
      }}
    >
      {label}
    </Typography>
    {editable ? (
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
      />
    ) : (
      <Typography variant="body" style={fieldStyles.value}>
        {value}
      </Typography>
    )}
  </View>
);

const fieldStyles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  value: { fontSize: 15, color: COLORS.text, paddingVertical: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  mapContainer: {
    height: 200,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  webView: {
    flex: 1,
  },
  editMapButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.brand,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  row: { flexDirection: 'row' },
  half: { flex: 1 },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  helpText: {
    flex: 1,
    lineHeight: 14,
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
});
