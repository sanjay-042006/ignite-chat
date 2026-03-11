import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,

    checkAuth: async () => {
        try {
            const res = await api.get('/auth/check');
            set({ authUser: res.data });
        } catch (error) {
            console.log('Error in checkAuth:', error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await api.post('/auth/signup', data);
            set({ authUser: res.data });
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message || 'Signup failed';
            console.error(msg);
            return { success: false, message: msg };
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await api.post('/auth/login', data);
            set({ authUser: res.data });
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message || 'Login failed';
            console.error(msg);
            return { success: false, message: msg };
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
            set({ authUser: null });
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
}));

export { api };
