import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoom } from '../requests/roomRequests';
import { refreshUserTimer, updateUserLocation } from '../requests/userRequests';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GPS_UPDATE_FREQUENCY = 20000;
const REFRESH_TIMER_TO = 270;

const COLORS = ['red', 'blue', 'green', 'purple', 'orange', 'yellow', 'pink', 'cyan', 'brown', 'lime', 'magenta', 'indigo', 'teal', 'violet', 'gold', 'silver', 'coral', 'navy'];

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

interface User {
    id: number;
    username: string;
    latitude: number | null;
    longitude: number | null;
    color?: string;
}

const Room: React.FC<RoomProps> = ({ route, navigation }) => {
    const { id, roomId, currentUserName } = route.params;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [timer, setTimer] = useState<number>(REFRESH_TIMER_TO);
    const [currentUser, setCurrentUser] = useState<User>();

    const assignUniqueColors = (userList: User[]): User[] => {
        const usedColors: Set<string> = new Set();
        return userList.map(user => {
            let availableColors = COLORS.filter(color => !usedColors.has(color));
            if (availableColors.length === 0) {
                availableColors = COLORS;
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
                const coloredUsers = assignUniqueColors(room.users);
                setUsers(coloredUsers);
            } catch (error) {
                console.error('Failed to fetch room data:', error);
                Alert.alert('Room closed', 'Room closed, create new room!');
                navigation.navigate('Homepage');
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
                setLocation(location);
            } catch (error) {
                console.error('Error getting location:', error);
                setErrorMsg('Failed to get location.');
            }
        };

        fetchRoomData();
        getLocation();

        const interval = setInterval(() => {
            setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        const sendLocationUpdate = async () => {
            setCurrentUser(users.find(user => user.username === currentUserName));
            if (location && currentUser) {
                try {
                    let location = await Location.getCurrentPositionAsync({});
                    setLocation(location);
                    await updateUserLocation(currentUser.id, location.coords.longitude, location.coords.latitude);
                } catch (error) {
                    console.error('Failed to update location:', error);
                    Alert.alert('Room closed', 'Room closed, create new room!');
                    navigation.navigate('Homepage');
                }
            }
        };

        const locationUpdateInterval = setInterval(() => {
            sendLocationUpdate();
        }, GPS_UPDATE_FREQUENCY);

        return () => clearInterval(locationUpdateInterval);
    }, [location, users, currentUserName]);

    if (errorMsg) {
        Alert.alert('Error', errorMsg);
    }

    if (timer <= 0){
        console.error('Room closed by timer');
        Alert.alert('Room closed', 'Room closed, create new room!');
        navigation.navigate('Homepage');
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleRefreshTimer = async () => {
        setTimer(REFRESH_TIMER_TO);
        try {
            await refreshUserTimer(currentUser.id);
        } catch (error) {
            console.error('Failed to refresh timer: ', error);
            Alert.alert('Room closed', 'Room closed, create new room!');
            navigation.navigate('Homepage');
        }
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
