import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../components/Header';
import { Typography } from '../components/Typography';
import { Icon } from '../components/Icon';
import { MapLocationPicker } from '../components/MapLocationPicker';
import { COLORS } from '../theme/colors';

const PROVINCES = ['Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'];

export const CreateLocationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showProvinces, setShowProvinces] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const handleCreate = () => {
    if (!name.trim() || !province || !lat || !lng) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      Alert.alert('Validation', 'Latitude and longitude must be valid numbers.');
      return;
    }
    
    // Validate coordinate ranges
    if (latNum < -90 || latNum > 90) {
      Alert.alert('Validation', 'Latitude must be between -90 and 90 degrees.');
      return;
    }
    if (lngNum < -180 || lngNum > 180) {
      Alert.alert('Validation', 'Longitude must be between -180 and 180 degrees.');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', `Location "${name}" created successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 600);
  };

  const handleLocationSelect = (latitude: number, longitude: number, address?: string) => {
    setLat(latitude.toFixed(6));
    setLng(longitude.toFixed(6));
    if (address) {
      setSelectedAddress(address);
    }
  };

  const openMapPicker = () => {
    setShowMapPicker(true);
  };

  const getCurrentCoordinates = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return {
      latitude: !isNaN(latNum) ? latNum : undefined,
      longitude: !isNaN(lngNum) ? lngNum : undefined,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Create Location" 
        showBack 
        onBack={() => navigation.goBack()} 
        rightElement={<View />}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Typography variant="caption" style={styles.label}>Location Name</Typography>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Musanze Bus Station" 
          placeholderTextColor={COLORS.textMuted} 
          value={name} 
          onChangeText={setName} 
        />

        <Typography variant="caption" style={styles.label}>Province</Typography>
        <TouchableOpacity style={styles.input} onPress={() => setShowProvinces(!showProvinces)}>
          <View style={styles.inputRow}>
            <Typography variant="body" color={province ? COLORS.text : COLORS.textMuted}>
              {province || 'Select province'}
            </Typography>
            <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>
        {showProvinces && (
          <View style={styles.dropdown}>
            {PROVINCES.map(p => (
              <TouchableOpacity 
                key={p} 
                style={styles.dropdownItem} 
                onPress={() => { 
                  setProvince(p); 
                  setShowProvinces(false); 
                }}
              >
                <Typography variant="body">{p}</Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Interactive Map */}
        <Typography variant="caption" style={styles.label}>GPS Coordinates</Typography>
        <TouchableOpacity style={styles.mapContainer} onPress={openMapPicker}>
          <View style={styles.mapHeader}>
            <Icon name="map" size={24} color={COLORS.brand} />
            <Typography variant="body" style={styles.mapTitle}>
              {lat && lng ? 'Update Location' : 'Select Location on Map'}
            </Typography>
            <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
          </View>
          
          {lat && lng && (
            <View style={styles.coordinatesPreview}>
              <Typography variant="caption" color={COLORS.textSecondary}>
                Lat: {parseFloat(lat).toFixed(6)}, Lng: {parseFloat(lng).toFixed(6)}
              </Typography>
              {selectedAddress && (
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.addressText}>
                  📍 {selectedAddress}
                </Typography>
              )}
            </View>
          )}
          
          {!lat && !lng && (
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.mapSubtitle}>
              Tap to open interactive map and select coordinates
            </Typography>
          )}
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.half}>
            <Typography variant="caption" style={styles.label}>Latitude</Typography>
            <TextInput 
              style={styles.input} 
              placeholder="-1.4989" 
              placeholderTextColor={COLORS.textMuted} 
              value={lat} 
              onChangeText={setLat} 
              keyboardType="numeric" 
            />
          </View>
          <View style={[styles.half, { marginLeft: 12 }]}>
            <Typography variant="caption" style={styles.label}>Longitude</Typography>
            <TextInput 
              style={styles.input} 
              placeholder="29.6340" 
              placeholderTextColor={COLORS.textMuted} 
              value={lng} 
              onChangeText={setLng} 
              keyboardType="numeric" 
            />
          </View>
        </View>

        <View style={styles.helpContainer}>
          <Icon name="info" size={16} color={COLORS.brand} />
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.helpText}>
            You can either use the map picker above or manually enter coordinates. 
            The map picker provides more accurate results and shows the exact location.
          </Typography>
        </View>

        <TouchableOpacity 
          style={[styles.btn, loading && { opacity: 0.7 }]} 
          onPress={handleCreate} 
          disabled={loading}
        >
          <Typography variant="body" color={COLORS.white} style={{ fontWeight: '700' }}>
            {loading ? 'Creating...' : 'Create Location'}
          </Typography>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  label: { 
    fontWeight: '600', 
    color: COLORS.textSecondary, 
    marginBottom: 6, 
    marginTop: 16, 
    textTransform: 'uppercase', 
    fontSize: 11, 
    letterSpacing: 0.8 
  },
  input: { 
    backgroundColor: COLORS.white, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: COLORS.text 
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdown: { 
    backgroundColor: COLORS.white, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginTop: 4, 
    overflow: 'hidden' 
  },
  dropdownItem: { 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  mapContainer: { 
    backgroundColor: COLORS.white,
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 6,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapTitle: {
    flex: 1,
    fontWeight: '600',
  },
  mapSubtitle: {
    marginTop: 8,
    lineHeight: 18,
  },
  coordinatesPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressText: {
    marginTop: 4,
    lineHeight: 16,
  },
  row: { flexDirection: 'row', marginTop: 0 },
  half: { flex: 1 },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  helpText: {
    flex: 1,
    lineHeight: 16,
  },
  btn: { 
    backgroundColor: COLORS.brand, 
    borderRadius: 14, 
    paddingVertical: 16, 
    alignItems: 'center', 
    marginTop: 32 
  },
});
