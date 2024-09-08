import axios from './axiosConfig';

export const createRoom = async (username: string) => {
    try {
        const response = await axios.post('/rooms', { username });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || 'Failed to create room');
    }
};

export const joinRoom = async (roomId: string, username: string) => {
    try {
        const response = await axios.post(`/rooms/${roomId}/users`, { username });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || 'Failed to join room');
    }
};

export const getRoom = async (roomId: string) => {
    try {
        const response = await axios.get(`/rooms/${roomId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data || 'Failed to fetch room data');
    }
};

export const deleteRoom = async (roomId: string) => {
    try {
        await axios.delete(`/rooms/${roomId}`);
    } catch (error) {
        throw new Error(error.response?.data || 'Failed to delete room');
    }
};
