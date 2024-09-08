import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { joinRoom } from '../requests/roomRequests';

const JoinRoom = ({ navigation }: any) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');

    const handleSubmit = async () => {
        if (!username.trim() || !roomId.trim()) {
            Alert.alert('Error', 'Both username and room ID are required.');
            return;
        }

        try {
            const response = await joinRoom(roomId, username);
            navigation.navigate('Room', response);
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <View className='flex-1 justify-center items-center bg-gray-200 p-4'>
            <TextInput
                className='border border-gray-300 p-2 mb-4 w-full'
                placeholder='Username'
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                className='border border-gray-300 p-2 mb-4 w-full'
                placeholder='Room ID'
                value={roomId}
                onChangeText={setRoomId}
            />
            <Button title='Join Room' onPress={handleSubmit} />
        </View>
    );
};

export default JoinRoom;
