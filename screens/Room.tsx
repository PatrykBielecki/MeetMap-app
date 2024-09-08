import React, { useEffect, useState } from 'react';
import { View, Text, Alert, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getRoom } from '../requests/roomRequests';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

interface RoomProps {
    route: {
        params: {
            id: number;
            roomId: string;
        };
    };
}

const Room: React.FC<RoomProps> = ({ route }) => {
    const { id } = route.params;
    const { roomId } = route.params;

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [timer, setTimer] = useState<number>(300);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const room = await getRoom(id.toString());
                setUsers(room.users.map((user: { username: string }) => user.username));
            } catch (error) {
                console.error('Failed to fetch room data:', error);
                Alert.alert('Error', 'Failed to fetch room data');
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
    }, [id]);

    if (errorMsg) {
        Alert.alert('Error', errorMsg);
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleRefreshTimer = () => {
        setTimer(300);
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
            <ScrollView className='ml-2'>
                {users.length > 0 ? (
                    users.map((user, index) => (
                        <View key={index} className='flex-row items-center mb-2'>
                            <Ionicons name='location' size={20} color='black' />
                            <Text className='text-base ml-2'>{user}</Text>
                        </View>
                    ))
                ) : (
                    <Text className='text-base text-center'>No users in this room.</Text>
                )}
            </ScrollView>
            <View className='absolute bottom-0 w-full flex-row justify-between items-center p-1 bg-black bg-opacity-50'>
                <Text className='text-white text-lg font-bold ml-4'>Room ID: {roomId}</Text>
                <View className='flex-row items-center mr-6'>
                    {/* Display the Timer */}
                    <Text className='text-white text-lg mr-3'>{formatTime(timer)}</Text>
                    {/* Refresh Button */}
                    <TouchableOpacity onPress={handleRefreshTimer}>
                        <Ionicons name='refresh' size={24} color='white' />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Room;
