import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoom } from '../requests/roomRequests';
import { updateUserLocation } from '../requests/userRequests'; // Import updateUserLocation API call
import Ionicons from 'react-native-vector-icons/Ionicons';

const UPDATE_FREQUENCY = 20000; // 20 seconds

// Expanded color array for user pins
const COLORS = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'pink', 'cyan', 'brown', 'lime', 'magenta', 'indigo', 'teal', 'violet', 'gold', 'silver', 'coral', 'navy'];

interface RoomProps {
    route: {
        params: {
            id: number;
            roomId: string;
            currentUserName: string;
        };
    };
}

interface User {
    id: number;
    username: string;
    latitude: number | null;
    longitude: number | null;
    color?: string; // Color assigned to user
}

const Room: React.FC<RoomProps> = ({ route }) => {
    const { id, roomId, currentUserName } = route.params;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [timer, setTimer] = useState<number>(300);

    // Function to assign unique colors to users
    const assignUniqueColors = (userList: User[]): User[] => {
        const usedColors: Set<string> = new Set();
        return userList.map(user => {
            let availableColors = COLORS.filter(color => !usedColors.has(color));
            if (availableColors.length === 0) {
                availableColors = COLORS; // Reuse colors if all are used
            }
            const assignedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
            usedColors.add(assignedColor);
            return { ...user, color: assignedColor };
        });
    };

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const room = await getRoom(id.toString());
                const coloredUsers = assignUniqueColors(room.users); // Assign unique colors to users
                setUsers(coloredUsers);
            } catch (error) {
                console.error('Failed to fetch room data:', error);
                Alert.alert('Error', 'Failed to fetch room data');
            }
        };

        const getLocation = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation(location); // Set the current user's location
            } catch (error) {
                console.error('Error getting location:', error);
                setErrorMsg('Failed to get location.');
            }
        };

        // Fetch room data and location on component mount
        fetchRoomData();
        getLocation();

        // Set a countdown timer
        const interval = setInterval(() => {
            setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
        }, 1000);

        return () => clearInterval(interval); // Clear interval on unmount
    }, [id]);

    useEffect(() => {
        const sendLocationUpdate = async () => {
            const currentUser = users.find(user => user.username === currentUserName);

            if (location && currentUser) {
                try {
                    let location = await Location.getCurrentPositionAsync({});
                    setLocation(location); // Update location in state
                    await updateUserLocation(currentUser.id, location.coords.longitude, location.coords.latitude);
                } catch (error) {
                    console.error('Failed to update location:', error);
                    Alert.alert('Error', 'Failed to update location');
                }
            }
        };

        // Periodically send location updates every 20 seconds
        const locationUpdateInterval = setInterval(() => {
            sendLocationUpdate();
        }, UPDATE_FREQUENCY);

        return () => clearInterval(locationUpdateInterval); // Clear interval on unmount
    }, [location, users, currentUserName]); // Re-run effect when location or users change

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
                
                {/* Display pins for other users */}
                {users.map((user, index) => {
                    if (user.latitude !== null && user.longitude !== null && user.username !== currentUserName) {
                        return (
                            <Marker
                                key={index}
                                coordinate={{
                                    latitude: user.latitude,
                                    longitude: user.longitude,
                                }}
                                pinColor={user.color} // Set pin color based on the user's assigned color
                                title={user.username}
                            />
                        );
                    }
                })}
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
                                <Ionicons name='location' size={20} color={user.color || 'black'} />
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
