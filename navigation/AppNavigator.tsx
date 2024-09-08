import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Homepage from '../screens/Homepage';
import JoinRoom from '../screens/JoinRoom';
import CreateRoom from '../screens/CreateRoom';
import Room from '../screens/Room';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name='Homepage' component={Homepage} />
            <Stack.Screen name='JoinRoom' component={JoinRoom} />
            <Stack.Screen name='CreateRoom' component={CreateRoom} />
            <Stack.Screen name='Room' component={Room} />
        </Stack.Navigator>
    );
}
