import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

const Homepage = ({ navigation }: any) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use this app.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const hasLocationServices = await Location.hasServicesEnabledAsync();
      if (!hasLocationServices) {
        setPermissionGranted(false);
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings for a better experience.',
          [{ text: 'OK' }]
        );
        return false;
      }

      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setPermissionGranted(false);
      Alert.alert('Error', 'An error occurred while requesting location permission.');
      return false;
    }
  };

  const handleNavigate = async (screen: string) => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      navigation.navigate(screen);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100">
      <Text className="text-2xl font-bold mb-4">Welcome to MeetMap</Text>
      <TouchableOpacity
        className="bg-blue-500 p-4 rounded mb-2"
        onPress={() => handleNavigate('JoinRoom')}
      >
        <Text className="text-white text-lg">Join Room</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-green-500 p-4 rounded"
        onPress={() => handleNavigate('CreateRoom')}
      >
        <Text className="text-white text-lg">Create Room</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Homepage;
