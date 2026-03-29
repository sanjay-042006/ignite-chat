import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    timeout: 15000, // Important: prevents UI from freezing forever on blocked domains
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
            toast.success("Account created successfully");
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message || 'Signup failed';
            console.error(msg);
            toast.error(msg);
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
            toast.success("Logged in successfully");
            return { success: true };
        } catch (error) {
            const apiurl = import.meta.env.VITE_API_URL || 'missing_url';
            const msg = error.response?.data?.message || `Login failed: ${error.message} (URL: ${apiurl})`;
            console.error(msg);
            toast.error(msg, { duration: 8000 });
            return { success: false, message: msg };
        } finally {
            set({ isLoggingIn: false });
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await api.put('/auth/update-profile', data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
            return { success: false, message: 'Failed to update profile' };
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
            set({ authUser: null });
            toast.success("Logged out successfully");
        } catch (error) {
            console.error('Logout error:', error);
            toast.error("Logout failed");
        }
    },
}));

export { api };
