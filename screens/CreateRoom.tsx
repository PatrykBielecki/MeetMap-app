import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { createRoom } from '../requests/roomRequests';

const CreateRoom = ({ navigation }: any) => {
  const [username, setUsername] = useState('');

  const handleCreateRoom = async () => {
    try {
      const response = await createRoom(username);
      navigation.navigate('Room', response);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-200 p-4">
      <TextInput
        className="border border-gray-300 p-2 mb-4 w-full"
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <Button title="Create Room" onPress={handleCreateRoom} />
    </View>
  );
};

export default CreateRoom;
