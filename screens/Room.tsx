import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Dimensions, ScrollView, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoom } from '../requests/roomRequests';
import { refreshUserTimer, updateUserLocation } from '../requests/userRequests';

const locationIcon = require('../assets/pin.png');
const refreshIcon = require('../assets/refresh.png');

const GPS_UPDATE_FREQUENCY = 20000;
const REFRESH_TIMER_TO = 270;

const COLORS = ['red', 'green', 'purple', 'orange', 'yellow', 'pink', 'brown', 'lime', 'magenta', 'indigo', 'violet', 'gold', 'silver', 'coral', 'navy'];

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

    const assignUniqueColors = (userList: User[], currentUserName: string): User[] => {
        return userList.map(user => {
            if (user.username === currentUserName) {
                return { ...user, color: 'blue' };
            } else {
                const colorIndex = user.id % COLORS.length;
                const assignedColor = COLORS[colorIndex];
                return { ...user, color: assignedColor };
            }
        });
    };

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const room = await getRoom(id.toString());
                const coloredUsers = assignUniqueColors(room.users, currentUserName);
                setUsers(coloredUsers);
    
                const currentUser = coloredUsers.find(user => user.username === currentUserName);
                setCurrentUser(currentUser);
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
    }, [id, currentUserName]);

    useEffect(() => {
        if (!currentUser) return;
    
        const sendLocationUpdate = async () => {
            if (location && currentUser) {
                try {
                    let currentLocation = await Location.getCurrentPositionAsync({});
                    setLocation(currentLocation);
                    const updatedRoom = await updateUserLocation(currentUser.id, currentLocation.coords.longitude, currentLocation.coords.latitude);
    
                    const coloredUsers = assignUniqueColors(updatedRoom.users, currentUserName);
                    setUsers(coloredUsers);
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
    }, [location, currentUser]);

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
        if (!currentUser.id) return;
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
                {users.map((user, index) => {
                    if (user.latitude !== null && user.longitude !== null) {
                        return (
                            <Marker
                                key={index}
                                coordinate={{
                                    latitude: user.latitude,
                                    longitude: user.longitude,
                                }}
                                pinColor={user.color}
                                title={user.username}
                            />
                        );
                    }
                })}
            </MapView>
            <View className='ml-2 mt-2'>
                {users.length > 0 && users.find(user => user.username === currentUserName) ? (
                    <View className='flex-row items-center mb-2'>
                        <View style={{
                                    width: 25,
                                    height: 25,
                                    borderRadius: 25,
                                    backgroundColor: 'blue',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                            <Image source={locationIcon} style={{ width: 20, height: 20}} />
                        </View>
                        <Text className='text-base ml-2 font-bold'>You: {currentUserName}</Text>
                    </View>
                ) : (
                    <Text className='text-base text-center'>You are not in this room.</Text>
                )}
            </View>
            <ScrollView className='ml-2'>
                {users.length > 0 ? (
                    users
                        .filter(user => user.username !== currentUserName) 
                        .map((user, index) => (
                            <View key={index} className='flex-row items-center mb-2'>
                                <View style={{
                                    width: 25,
                                    height: 25,
                                    borderRadius: 25,
                                    backgroundColor: user.color || 'gray',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Image source={locationIcon} style={{ width: 20, height: 20}} />
                                </View>
                                <Text className='text-base ml-2'>{user.username}</Text>
                            </View>
                        ))
                ) : (
                    <Text className='text-base text-center'>No users in this room.</Text>
                )}
            </ScrollView>
            <View className='absolute bottom-0 w-full flex-row justify-between items-center p-1 bg-black bg-opacity-50 py-2'>
                <Text className='text-white text-lg font-bold ml-4'>Room ID: {roomId}</Text>
                <View className='flex-row items-center mr-6'>
                    <Text className='text-white text-lg mr-3 pr-2'>{formatTime(timer)}</Text>
                    { timer <= REFRESH_TIMER_TO - 5 &&
                        <TouchableOpacity onPress={handleRefreshTimer}>
                            <Image source={refreshIcon} style={{ width: 20, height: 20 }} />
                        </TouchableOpacity>
                    }
                </View>
            </View>
        </View>
    );
};

export default Room;
