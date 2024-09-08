import axios from './axiosConfig';

export const createUser = async (username: string) => {
    try {
        const response = await axios.post('/users', { username });
        return response.data;
    } catch (error) {
        throw new Error(error.response.data || 'Failed to create user');
    }
};

export const getAllUsers = async () => {
    try {
        const response = await axios.get('/users');
        return response.data;
    } catch (error) {
        throw new Error(error.response.data || 'Failed to fetch users');
    }
};

export const getUserById = async (userId: string) => {
    try {
        const response = await axios.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response.data || 'Failed to fetch users');
    }
};

export const deleteUserById = async (userId: string) => {
    try {
        await axios.delete(`/users/${userId}`);
    } catch (error) {
        throw new Error(error.response.data || 'Failed to delete user');
    }
};
