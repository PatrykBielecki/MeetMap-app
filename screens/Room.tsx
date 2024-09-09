import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoom } from '../requests/roomRequests';
import { updateUserLocation } from '../requests/userRequests'; // Import updateUserLocation API call
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const UPDATE_FREQUENCY = 20000; // 20 seconds

interface RoomProps {
    navigation,
    route: {
        params: {
            id: number;
            roomId: string;
            currentUserName: string;
        };
    };
}

const Room: React.FC<RoomProps> = ({ route, navigation }) => {
    const { id, roomId, currentUserName } = route.params;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
    const [timer, setTimer] = useState<number>(300);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const room = await getRoom(id.toString());
                setUsers(room.users);
            } catch (error) {
                console.error('Failed to fetch room data:', error);
                Alert.alert('Room Closed', 'Room closed, join or create new room!');
                navigation.navigate('Homepage'); // Navigate to Home if an error occurs
            }
        };

        const getLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        };

        fetchRoomData();
        getLocation();

        const interval = setInterval(() => {
            setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [id, navigation]);

    useEffect(() => {
        const sendLocationUpdate = async () => {
            const currentUser = users.find(user => user.username === currentUserName);

            if (location && currentUser) {
                try {
                    let location = await Location.getCurrentPositionAsync({});
                    setLocation(location);
                    await updateUserLocation(currentUser.id, location.coords.longitude, location.coords.latitude);
                } catch (error) {
                    console.error('Failed to update location:', error);
                    Alert.alert('Room Closed', 'Room closed, join or create new room!');
                    navigation.navigate('Homepage'); // Go back to home screen on error
                }
            }
        };

        const locationUpdateInterval = setInterval(() => {
            sendLocationUpdate();
        }, UPDATE_FREQUENCY); // Update every 20 seconds

        return () => clearInterval(locationUpdateInterval); // Clear interval on component unmount
    }, [location, users, currentUserName, navigation]);

    if (errorMsg) {
        Alert.alert('Error', errorMsg);
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleRefreshTimer = () => {
        setTimer(300); // Reset timer to 5 minutes
    };

    return (
        <View className='flex-1'>
            <MapView
                className='w-full h-3/4'
                initialRegion={{
                    latitude: location?.coords.latitude || 37.78825,
                    longitude: location?.coords.longitude || -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}>
                {location && (
                    <Marker
                        coordinate={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }}
                        title='You are here'
                    />
                )}
            </MapView>

            {/* Current User Section */}
            <View className='p-4'>
                {users.length > 0 && users.find(user => user.username === currentUserName) ? (
                    <View className='flex-row items-center mb-2'>
                        <Ionicons name='person-circle' size={20} color='blue' />
                        <Text className='text-base ml-2 font-bold'>You: {currentUserName}</Text>
                    </View>
                ) : (
                    <Text className='text-base text-center'>You are not in this room.</Text>
                )}
            </View>

            <ScrollView className='ml-2'>
                {users.length > 0 ? (
                    users
                        .filter(user => user.username !== currentUserName) // Exclude current user from the list
                        .map((user, index) => (
                            <View key={index} className='flex-row items-center mb-2'>
                                <Ionicons name='location' size={20} color='black' />
                                <Text className='text-base ml-2'>{user.username}</Text>
                            </View>
                        ))
                ) : (
                    <Text className='text-base text-center'>No users in this room.</Text>
                )}
            </ScrollView>

            <View className='absolute bottom-0 w-full flex-row justify-between items-center p-1 bg-black bg-opacity-50'>
                <Text className='text-white text-lg font-bold ml-4'>Room ID: {roomId}</Text>
                <View className='flex-row items-center mr-6'>
                    <Text className='text-white text-lg mr-3'>{formatTime(timer)}</Text>
                    <TouchableOpacity onPress={handleRefreshTimer}>
                        <Ionicons name='refresh' size={24} color='white' />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Room;
